"use server";

/**
 * 积分系统 Server Actions
 *
 * 提供积分系统的前端调用接口
 */

import { z } from "zod";

import { getBaseUrl } from "@/config/payment";
import { actionClient, protectedAction } from "@/lib/safe-action";
import { creem } from "@/features/payment/creem";
import { logEvent } from "@/lib/logger";

import {
  CREDIT_PACKAGES,
  CREDITS_EXPIRY_DAYS,
  MONTHLY_SUBSCRIPTION_CREDITS,
  REGISTRATION_BONUS_CREDITS,
} from "./config";
import {
  consumeCredits,
  ensureRegistrationBonus,
  getCreditsBalance,
  getUserActiveBatches,
  getUserTransactions,
  grantCredits,
  InsufficientCreditsError,
  AccountFrozenError,
} from "./core";

const withPublicCreditsAction = (name: string) =>
  actionClient.metadata({ action: `credits.${name}` });
const withProtectedCreditsAction = (name: string) =>
  protectedAction.metadata({ action: `credits.${name}` });

// ============================================
// 公开 Actions
// ============================================

/**
 * 注册奖励积分
 *
 * 新用户注册时调用，赠送初始积分
 */
export const grantRegistrationBonus = withPublicCreditsAction("grantRegistrationBonus")
  .schema(
    z.object({
      userId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput }) => {
    const { userId } = parsedInput;
    const expiresAt = CREDITS_EXPIRY_DAYS
      ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      : null;

    const result = await grantCredits({
      userId,
      amount: REGISTRATION_BONUS_CREDITS,
      sourceType: "bonus",
      debitAccount: "SYSTEM:registration_bonus",
      transactionType: "registration_bonus",
      expiresAt,
      description: "新用户注册奖励",
      metadata: {
        bonusType: "registration",
      },
    });

    return {
      success: true,
      ...result,
    };
  });

// ============================================
// 受保护 Actions（需要登录）
// ============================================

/**
 * 获取当前用户积分余额
 *
 * 包含懒加载注册奖励机制:
 * 首次调用时，如果用户没有任何交易记录，会自动发放注册奖励
 */
export const getMyCreditsBalance = withProtectedCreditsAction("getMyCreditsBalance")
  .action(async ({ ctx }) => {
    const { userId } = ctx;

    // 懒加载: 确保新用户获得注册奖励
    await ensureRegistrationBonus(userId, REGISTRATION_BONUS_CREDITS, CREDITS_EXPIRY_DAYS);

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
export const getMyActiveBatches = withProtectedCreditsAction("getMyActiveBatches")
  .action(async ({ ctx }) => {
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
    z.object({
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional()
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const limit = parsedInput?.limit;
    const offset = parsedInput?.offset;

    const transactions = await getUserTransactions(userId, {
      ...(limit !== undefined && { limit }),
      ...(offset !== undefined && { offset }),
    });

    return transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      debitAccount: tx.debitAccount,
      creditAccount: tx.creditAccount,
      description: tx.description,
      metadata: tx.metadata as Record<string, unknown> | null,
      createdAt: tx.createdAt,
    }));
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
export const checkCreditsAvailable = withProtectedCreditsAction("checkCreditsAvailable")
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
// 订阅相关积分 Actions
// ============================================

/**
 * 发放月度订阅积分
 *
 * 在订阅续费时调用
 */
export const grantMonthlySubscriptionCredits = withPublicCreditsAction("grantMonthlySubscriptionCredits")
  .schema(
    z.object({
      userId: z.string().min(1),
      subscriptionId: z.string().min(1),
    })
  )
  .action(async ({ parsedInput }) => {
    const { userId, subscriptionId } = parsedInput;
    // 月度积分，下个月过期
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const result = await grantCredits({
      userId,
      amount: MONTHLY_SUBSCRIPTION_CREDITS,
      sourceType: "subscription",
      debitAccount: `SUBSCRIPTION:${subscriptionId}`,
      transactionType: "monthly_grant",
      expiresAt,
      sourceRef: subscriptionId,
      description: "月度订阅积分",
      metadata: {
        subscriptionId,
        grantType: "monthly",
      },
    });

    return {
      success: true,
      ...result,
    };
  });

/**
 * 购买积分 (内部函数)
 *
 * 由 Creem Webhook 调用，在支付成功后发放积分
 * 注意: 这个函数不应该直接被前端调用
 */
export const purchaseCredits = withProtectedCreditsAction("purchaseCredits")
  .schema(
    z.object({
      amount: z.number().min(1),
      paymentId: z.string().min(1),
      expiresInDays: z.number().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { userId } = ctx;
    const { amount, paymentId, expiresInDays } = parsedInput;

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await grantCredits({
      userId,
      amount,
      sourceType: "purchase",
      debitAccount: `PAYMENT:${paymentId}`,
      transactionType: "purchase",
      expiresAt,
      sourceRef: paymentId,
      description: `购买 ${amount} 积分`,
      metadata: {
        paymentId,
        purchaseType: "direct",
      },
    });

    logEvent("credits.purchased", {
      userId,
      amount,
      paymentId,
      source: "creem",
    });

    return {
      success: true,
      ...result,
    };
  });

// ============================================
// 积分购买 Checkout
// ============================================

/**
 * 创建积分购买 Checkout Session
 *
 * 创建 Creem Checkout Session 用于购买积分套餐
 * metadata 中包含 type: 'credit_purchase' 和 credits 数量
 * Webhook 会根据这些信息发放积分
 */
export const createCreditsPurchaseCheckout = withProtectedCreditsAction("createCreditsPurchaseCheckout")
  .schema(
    z.object({
      packageId: z.enum(["lite", "standard", "pro"]),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    const { packageId, successUrl } = parsedInput;
    const { userId } = ctx;

    // 查找套餐配置
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      throw new Error("无效的积分套餐");
    }

    const baseUrl = getBaseUrl();

    logEvent("payment.checkout.started", {
      userId,
      packageId: pkg.id,
      credits: pkg.credits,
      provider: "creem",
      checkoutType: "credits",
    });

    // 创建 Creem Checkout Session（一次性支付）
    // 注意：Creem 需要预先在后台创建产品，这里使用 packageId 作为 product_id
    // 实际使用时需要在 Creem 后台创建对应的积分产品
    const checkout = await creem.createCheckout({
      product_id: `credits_${packageId}`, // 需要在 Creem 后台创建对应产品
      success_url:
        successUrl ??
        `${baseUrl}/dashboard/settings?tab=usage&success=true&credits=${pkg.credits}`,
      request_id: `credit_purchase_${userId}_${Date.now()}`,
      metadata: {
        userId,
        type: "credit_purchase", // 关键: Webhook 用此判断类型
        credits: String(pkg.credits),
        packageId: pkg.id,
      },
    });

    return { url: checkout.checkout_url };
  });

/**
 * 获取积分套餐列表
 */
export const getCreditPackages = withProtectedCreditsAction("getCreditPackages")
  .action(async () => {
    return CREDIT_PACKAGES.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      description: pkg.description,
      popular: "popular" in pkg ? pkg.popular : false,
    }));
  });
