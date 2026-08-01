"use server";

import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import {
  findPlanByPriceId,
  getSafePaymentCallbackUrl,
  paymentConfig,
} from "@/config/payment";
import { db } from "@/db";
import { subscription } from "@/db/schema/subscription";
import { logEvent } from "@/lib/logger";
import { protectedAction } from "@/lib/safe-action";
import { paymentService } from "@/services/payment";
import { trackServerEvent } from "@/services/telemetry";

import { PaymentType } from "./types";

/**
 * 创建支付 Checkout Session
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
    const { cancelUrl, priceId, successUrl, type } = parsedInput;
    const { userId } = ctx;
    const locale = (await getLocale()) as "en" | "zh";

    const { plan, price } = findPlanByPriceId(priceId);
    if (!plan || !price) {
      throw new Error("未登记的价格 ID");
    }
    const paymentType = type ?? price.type;
    if (paymentType !== price.type) {
      throw new Error("支付类型与价格配置不匹配");
    }

    // 检查是否已有活跃订阅
    const [existingSub] = await db
      .select({ status: subscription.status })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (
      existingSub &&
      ["active", "trialing", "lifetime"].includes(existingSub.status)
    ) {
      throw new Error("您已有活跃订阅，请先取消当前订阅后再订阅新计划");
    }

    logEvent("payment.checkout.started", {
      userId,
      priceId,
      planId: plan?.id ?? "unknown",
      provider: paymentService.provider,
    });
    trackServerEvent({
      attributes: {
        checkoutType:
          paymentType === PaymentType.ONE_TIME ? "one-time" : "subscription",
        planId: plan?.id ?? "unknown",
        priceId,
        provider: paymentService.provider,
      },
      context: { identity: { userId } },
      name: "payment.checkout.started",
      source: "server",
      version: 1,
    });

    const checkout = await paymentService.createCheckout({
      productId: priceId,
      mode: paymentType === PaymentType.ONE_TIME ? "one-time" : "subscription",
      successUrl: getSafePaymentCallbackUrl(
        successUrl,
        `/${locale}${paymentConfig.redirectAfterCheckout}?success=true`
      ),
      cancelUrl: getSafePaymentCallbackUrl(
        cancelUrl,
        `/${locale}${paymentConfig.redirectAfterCancel}`
      ),
      requestId: `${userId}_${priceId}_${Date.now()}`,
      metadata: {
        productId: priceId,
        type: paymentType,
        userId,
        planId: plan?.id ?? "unknown",
      },
    });

    return { url: checkout.url };
  });

/**
 * 取消订阅
 *
 * 调用支付服务取消用户的订阅
 */
export const cancelSubscription = protectedAction
  .metadata({ action: "payment.cancelSubscription" })
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

    await paymentService.cancelSubscription(userSubscription.subscriptionId);

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
    trackServerEvent({
      attributes: {
        provider: paymentService.provider,
        subscriptionId: userSubscription.subscriptionId,
      },
      context: { identity: { userId } },
      name: "payment.subscription.cancel_requested",
      source: "server",
      version: 1,
    });

    return { success: true };
  });

/**
 * 获取用户当前订阅状态
 *
 * 用于在前端显示用户的订阅信息
 */
export const getUserSubscription = protectedAction
  .metadata({ action: "payment.getUserSubscription" })
  .action(async ({ ctx }) => {
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
    const isActive = ["active", "trialing", "lifetime"].includes(
      userSubscription.status
    );
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
  });

/**
 * 检查用户是否有有效订阅
 */
export const hasActiveSubscription = protectedAction
  .metadata({ action: "payment.hasActiveSubscription" })
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    const [userSubscription] = await db
      .select({ status: subscription.status })
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    if (!userSubscription) {
      return { hasSubscription: false, status: null };
    }

    const isActive = ["active", "trialing", "lifetime"].includes(
      userSubscription.status
    );

    return {
      hasSubscription: isActive,
      status: userSubscription.status,
    };
  });
