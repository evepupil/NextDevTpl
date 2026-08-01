"use server";

/**
 * 积分系统 Server Actions
 *
 * 提供积分系统的前端调用接口
 */

import { getLocale } from "next-intl/server";
import { z } from "zod";

import { getSafePaymentCallbackUrl, paymentConfig } from "@/config/payment";
import { logEvent } from "@/lib/logger";
import { protectedAction } from "@/lib/safe-action";
import { paymentService } from "@/services/payment";
import { trackServerEvent } from "@/services/telemetry";

import {
  CREDIT_PACKAGES,
  CREDITS_EXPIRY_DAYS,
  REGISTRATION_BONUS_CREDITS,
} from "./config";
import {
  AccountFrozenError,
  consumeCredits,
  ensureRegistrationBonus,
  getCreditsBalance,
  getUserActiveBatches,
  getUserTransactions,
  getUserTransactionsCount,
  InsufficientCreditsError,
} from "./core";

const withProtectedCreditsAction = (name: string) =>
  protectedAction.metadata({ action: `credits.${name}` });

// ============================================
// 受保护 Actions（需要登录）
// ============================================

/**
 * 获取当前用户积分余额
 *
 * 包含懒加载注册奖励机制:
 * 首次调用时，如果用户没有任何交易记录，会自动发放注册奖励
 */
export const getMyCreditsBalance = withProtectedCreditsAction(
  "getMyCreditsBalance"
).action(async ({ ctx }) => {
  const { userId } = ctx;

  // 懒加载: 确保新用户获得注册奖励
  await ensureRegistrationBonus(
    userId,
    REGISTRATION_BONUS_CREDITS,
    CREDITS_EXPIRY_DAYS
  );

  // 获取余额
  const balance = await getCreditsBalance(userId);

  return {
    balance: balance.balance,
    totalEarned: balance.totalEarned,
    totalSpent: balance.totalSpent,
    status: balance.status,
  };
});

/**
 * 获取当前用户活跃批次
 */
export const getMyActiveBatches = withProtectedCreditsAction(
  "getMyActiveBatches"
).action(async ({ ctx }) => {
  const { userId } = ctx;
  const batches = await getUserActiveBatches(userId);

  return batches.map((batch) => ({
    id: batch.id,
    amount: batch.amount,
    remaining: batch.remaining,
    issuedAt: batch.issuedAt,
    expiresAt: batch.expiresAt,
    sourceType: batch.sourceType,
  }));
});

/**
 * 获取当前用户交易历史
 */
export const getMyTransactions = withProtectedCreditsAction("getMyTransactions")
  .schema(
    z
      .object({
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      })
      .optional()
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const limit = parsedInput?.limit;
    const offset = parsedInput?.offset;

    const [transactions, totalCount] = await Promise.all([
      getUserTransactions(userId, {
        ...(limit !== undefined && { limit }),
        ...(offset !== undefined && { offset }),
      }),
      getUserTransactionsCount(userId),
    ]);

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        debitAccount: tx.debitAccount,
        creditAccount: tx.creditAccount,
        description: tx.description,
        metadata: tx.metadata as Record<string, unknown> | null,
        createdAt: tx.createdAt,
      })),
      totalCount,
    };
  });

/**
 * 消费积分
 *
 * 用于 AI 服务等需要消费积分的场景
 */
export const useCredits = withProtectedCreditsAction("useCredits")
  .schema(
    z.object({
      amount: z.number().min(1),
      serviceName: z.string().min(1),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { amount, serviceName, description, metadata } = parsedInput;

    try {
      const result = await consumeCredits({
        userId,
        amount,
        serviceName,
        ...(description !== undefined && { description }),
        ...(metadata !== undefined && { metadata }),
      });

      logEvent("credits.consumed", {
        userId,
        amount,
        serviceName,
      });
      trackServerEvent({
        attributes: { amount, serviceName },
        context: { identity: { userId } },
        name: "credits.consumed",
        source: "server",
        version: 1,
      });

      return {
        success: true,
        consumedAmount: result.consumedAmount,
        remainingBalance: result.remainingBalance,
        transactionId: result.transactionId,
      };
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        return {
          success: false,
          error: "insufficient_credits",
          message: error.message,
          required: error.required,
          available: error.available,
        };
      }
      if (error instanceof AccountFrozenError) {
        return {
          success: false,
          error: "account_frozen",
          message: error.message,
        };
      }
      throw error;
    }
  });

/**
 * 检查用户是否有足够积分
 */
export const checkCreditsAvailable = withProtectedCreditsAction(
  "checkCreditsAvailable"
)
  .schema(
    z.object({
      amount: z.number().min(1),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { amount } = parsedInput;

    const balance = await getCreditsBalance(userId);

    // balance 由 ensureCreditsBalance 保证不为 undefined
    return {
      available: balance.balance >= amount && balance.status === "active",
      currentBalance: balance.balance,
      required: amount,
      status: balance.status,
    };
  });

// ============================================
// 积分购买 Checkout
// ============================================

/**
 * 创建积分购买 Checkout Session
 *
 * 创建支付 Checkout Session 用于购买积分套餐
 * metadata 中包含 type: 'credit_purchase' 和 credits 数量
 * Webhook 会根据这些信息发放积分
 */
export const createCreditsPurchaseCheckout = withProtectedCreditsAction(
  "createCreditsPurchaseCheckout"
)
  .schema(
    z.object({
      packageId: z.enum(["lite", "standard", "pro"]),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { cancelUrl, packageId, successUrl } = parsedInput;
    const { userId } = ctx;
    const locale = (await getLocale()) as "en" | "zh";

    // 查找套餐配置
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw new Error("无效的积分套餐");
    }

    logEvent("payment.checkout.started", {
      userId,
      packageId: pkg.id,
      credits: pkg.credits,
      provider: paymentService.provider,
      checkoutType: "credits",
    });
    trackServerEvent({
      attributes: {
        checkoutType: "credits",
        credits: pkg.credits,
        packageId: pkg.id,
        provider: paymentService.provider,
      },
      context: { identity: { userId } },
      name: "payment.checkout.started",
      source: "server",
      version: 1,
    });

    const checkout = await paymentService.createCheckout({
      productId: `credits_${packageId}`,
      mode: "one-time",
      successUrl: getSafePaymentCallbackUrl(
        successUrl,
        `/${locale}/dashboard/settings?tab=usage&success=true&credits=${pkg.credits}`
      ),
      cancelUrl: getSafePaymentCallbackUrl(
        cancelUrl,
        `/${locale}${paymentConfig.redirectAfterCancel}`
      ),
      requestId: `credit_purchase_${userId}_${Date.now()}`,
      metadata: {
        userId,
        type: "credit_purchase",
        credits: String(pkg.credits),
        packageId: pkg.id,
        productId: `credits_${pkg.id}`,
      },
    });

    return { url: checkout.url };
  });

/**
 * 获取积分套餐列表
 */
export const getCreditPackages = withProtectedCreditsAction(
  "getCreditPackages"
).action(async () => {
  return CREDIT_PACKAGES.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    credits: pkg.credits,
    price: pkg.price,
    description: pkg.description,
    popular: "popular" in pkg ? pkg.popular : false,
  }));
});
