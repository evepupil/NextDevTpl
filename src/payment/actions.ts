"use server";

import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";

import { findPlanByPriceId, getBaseUrl, paymentConfig } from "@/config/payment";
import { db } from "@/db";
import { subscription, user } from "@/db/schema";
import { protectedAction } from "@/lib/safe-action";
import { PaymentType } from "@/payment/types";

import { stripe } from "./stripe";

/**
 * 创建 Stripe Checkout Session
 *
 * 支持订阅支付和一次性支付两种模式
 * 订阅模式可选配置试用期
 */
export const createCheckoutSession = protectedAction
  .schema(
    z.object({
      priceId: z.string().min(1, "价格 ID 不能为空"),
      type: z.nativeEnum(PaymentType).optional(),
      trialPeriodDays: z.number().optional(),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { priceId, type, trialPeriodDays, successUrl, cancelUrl } = parsedInput;
    const { userId, user: currentUser } = ctx;

    // 查找计划和价格信息
    const { plan, price } = findPlanByPriceId(priceId);

    // 确定支付类型（优先使用传入的，否则从配置获取）
    const paymentType = type ?? price?.type ?? PaymentType.SUBSCRIPTION;

    // 确定试用期天数（优先使用传入的，否则从配置获取）
    const trialDays = trialPeriodDays ?? price?.trialPeriodDays;

    // 查询用户的 Stripe Customer ID
    const [dbUser] = await db
      .select({ stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    let stripeCustomerId = dbUser?.stripeCustomerId;

    // 如果用户没有 Stripe Customer ID，创建一个
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: currentUser.email,
        name: currentUser.name,
        metadata: {
          userId,
        },
      });

      stripeCustomerId = customer.id;

      // 保存 Stripe Customer ID 到数据库
      await db
        .update(user)
        .set({ stripeCustomerId })
        .where(eq(user.id, userId));
    }

    const baseUrl = getBaseUrl();

    // 根据支付类型创建不同的 Checkout Session
    if (paymentType === PaymentType.ONE_TIME) {
      // 一次性支付（Lifetime 计划）
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl ?? `${baseUrl}${paymentConfig.redirectAfterCheckout}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl ?? `${baseUrl}${paymentConfig.redirectAfterCancel}?canceled=true`,
        metadata: {
          userId,
          planId: plan?.id ?? "unknown",
          paymentType: PaymentType.ONE_TIME,
        },
      });

      return { url: session.url };
    }

    // 订阅支付
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl ?? `${baseUrl}${paymentConfig.redirectAfterCheckout}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${baseUrl}${paymentConfig.redirectAfterCancel}?canceled=true`,
      metadata: {
        userId,
        planId: plan?.id ?? "unknown",
        paymentType: PaymentType.SUBSCRIPTION,
      },
    };

    // 添加试用期配置
    if (trialDays && trialDays > 0) {
      sessionParams.subscription_data = {
        trial_period_days: trialDays,
        metadata: {
          userId,
          planId: plan?.id ?? "unknown",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { url: session.url };
  });

/**
 * 创建 Stripe Customer Portal Session
 *
 * 用于用户管理现有订阅（升级、降级、取消等）
 */
export const createCustomerPortal = protectedAction
  .schema(
    z.object({
      returnUrl: z.string().optional(),
    }).optional()
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const returnUrl = parsedInput?.returnUrl;

    // 查询用户的 Stripe Customer ID
    const [dbUser] = await db
      .select({ stripeCustomerId: user.stripeCustomerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!dbUser?.stripeCustomerId) {
      throw new Error("您还没有订阅任何计划");
    }

    const baseUrl = getBaseUrl();

    // 创建 Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: returnUrl ?? `${baseUrl}/dashboard`,
    });

    return { url: session.url };
  });

/**
 * 获取用户当前订阅状态
 *
 * 用于在前端显示用户的订阅信息
 */
export const getUserSubscription = protectedAction.action(
  async ({ ctx }) => {
    const { userId } = ctx;

    // 查询用户的订阅信息
    const [userSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription) {
      return { subscription: null };
    }

    // 检查订阅是否有效
    const isActive = ["active", "trialing"].includes(userSubscription.status);
    const isTrialing = userSubscription.status === "trialing";

    return {
      subscription: {
        id: userSubscription.id,
        status: userSubscription.status,
        priceId: userSubscription.stripePriceId,
        currentPeriodStart: userSubscription.currentPeriodStart,
        currentPeriodEnd: userSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: userSubscription.cancelAtPeriodEnd,
        isActive,
        isTrialing,
      },
    };
  }
);

/**
 * 检查用户是否有有效订阅
 */
export const hasActiveSubscription = protectedAction.action(
  async ({ ctx }) => {
    const { userId } = ctx;

    const [userSubscription] = await db
      .select({ status: subscription.status })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription) {
      return { hasSubscription: false, status: null };
    }

    const isActive = ["active", "trialing", "lifetime"].includes(userSubscription.status);

    return {
      hasSubscription: isActive,
      status: userSubscription.status,
    };
  }
);
