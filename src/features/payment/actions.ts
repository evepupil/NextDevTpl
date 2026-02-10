"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { findPlanByPriceId, getBaseUrl, paymentConfig } from "@/config/payment";
import { db } from "@/db";
import { subscription } from "@/db/schema";
import { protectedAction } from "@/lib/safe-action";
import { logEvent } from "@/lib/logger";
import { PaymentType } from "@/features/payment/types";

import { creem } from "./creem";

/**
 * 创建 Creem Checkout Session
 *
 * 支持订阅支付和一次性支付两种模式
 */
export const createCheckoutSession = protectedAction
  .metadata({ action: "payment.createCheckoutSession" })
  .schema(
    z.object({
      priceId: z.string().min(1, "价格 ID 不能为空"),
      type: z.nativeEnum(PaymentType).optional(),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { priceId, successUrl } = parsedInput;
    const { userId } = ctx;

    // 检查是否已有活跃订阅
    const [existingSub] = await db
      .select({ status: subscription.status })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (existingSub && ["active", "trialing", "lifetime"].includes(existingSub.status)) {
      throw new Error("您已有活跃订阅，请先取消当前订阅后再订阅新计划");
    }

    // 查找计划和价格信息
    const { plan } = findPlanByPriceId(priceId);

    const baseUrl = getBaseUrl();

    logEvent("payment.checkout.started", {
      userId,
      priceId,
      planId: plan?.id ?? "unknown",
      provider: "creem",
    });

    // 创建 Creem Checkout
    const checkout = await creem.createCheckout({
      product_id: priceId,
      success_url: successUrl ?? `${baseUrl}${paymentConfig.redirectAfterCheckout}?success=true`,
      request_id: `${userId}_${Date.now()}`,
      metadata: {
        userId,
        planId: plan?.id ?? "unknown",
      },
    });

    return { url: checkout.checkout_url };
  });

/**
 * 创建订阅管理链接
 *
 * Creem 不提供类似 Stripe Customer Portal 的功能
 * 用户需要通过 Creem 的订阅管理页面或联系支持来管理订阅
 * 这里返回 null，前端可以显示取消订阅按钮或联系支持链接
 */
export const createCustomerPortal = protectedAction
  .metadata({ action: "payment.createCustomerPortal" })
  .schema(
    z.object({
      returnUrl: z.string().optional(),
    }).optional()
  )
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // 查询用户的订阅
    const [userSubscription] = await db
      .select({ subscriptionId: subscription.subscriptionId })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription?.subscriptionId) {
      throw new Error("您还没有订阅任何计划");
    }

    // Creem 没有 Customer Portal，返回 null
    // 前端可以显示取消订阅按钮或联系支持链接
    return { url: null, subscriptionId: userSubscription.subscriptionId };
  });

/**
 * 取消订阅
 *
 * 调用 Creem API 取消用户的订阅
 */
export const cancelSubscription = protectedAction
  .metadata({ action: "payment.cancelSubscription" })
  .action(
  async ({ ctx }) => {
    const { userId } = ctx;

    // 查询用户的订阅
    const [userSubscription] = await db
      .select({ subscriptionId: subscription.subscriptionId })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription?.subscriptionId) {
      throw new Error("您还没有订阅任何计划");
    }

    // 调用 Creem API 取消订阅
    await creem.cancelSubscription(userSubscription.subscriptionId);

    // 更新数据库状态
    await db
      .update(subscription)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscription.userId, userId));

    logEvent("payment.subscription.canceled", {
      userId,
      subscriptionId: userSubscription.subscriptionId,
    });

    return { success: true };
  }
);

/**
 * 获取用户当前订阅状态
 *
 * 用于在前端显示用户的订阅信息
 */
export const getUserSubscription = protectedAction
  .metadata({ action: "payment.getUserSubscription" })
  .action(
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
        priceId: userSubscription.priceId,
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
export const hasActiveSubscription = protectedAction
  .metadata({ action: "payment.hasActiveSubscription" })
  .action(
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
