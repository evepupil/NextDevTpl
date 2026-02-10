/**
 * 积分系统核心逻辑
 *
 * 实现企业级双重记账和 FIFO 过期机制
 */

import { and, asc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  creditsBalance,
  creditsBatch,
  creditsTransaction,
  type CreditsBatchSource,
  type CreditsTransactionType,
} from "@/db/schema";
import { logEvent } from "@/lib/logger";

// ============================================
// 类型定义
// ============================================

/**
 * 发放积分参数
 */
export interface GrantCreditsParams {
  /** 用户 ID */
  userId: string;
  /** 积分数量 */
  amount: number;
  /** 来源类型 */
  sourceType: CreditsBatchSource;
  /** 借方账户（资金来源） */
  debitAccount: string;
  /** 交易类型 */
  transactionType: CreditsTransactionType;
  /** 过期时间（可选） */
  expiresAt?: Date | null;
  /** 来源引用（如订单ID） */
  sourceRef?: string;
  /** 描述 */
  description?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 消费积分参数
 */
export interface ConsumeCreditsParams {
  /** 用户 ID */
  userId: string;
  /** 消费数量 */
  amount: number;
  /** 服务名称 */
  serviceName: string;
  /** 描述 */
  description?: string;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 积分消费结果
 */
export interface ConsumeCreditsResult {
  /** 是否成功 */
  success: boolean;
  /** 实际消费数量 */
  consumedAmount: number;
  /** 剩余余额 */
  remainingBalance: number;
  /** 交易 ID */
  transactionId: string;
  /** 消费的批次详情 */
  consumedBatches: Array<{
    batchId: string;
    consumedFromBatch: number;
  }>;
}

/**
 * 积分余额错误
 */
export class InsufficientCreditsError extends Error {
  constructor(
    public required: number,
    public available: number
  ) {
    super(`积分不足: 需要 ${required}，可用 ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

/**
 * 账户冻结错误
 */
export class AccountFrozenError extends Error {
  constructor(userId: string) {
    super(`用户 ${userId} 的积分账户已被冻结`);
    this.name = "AccountFrozenError";
  }
}

// ============================================
// 核心函数
// ============================================

/**
 * 确保用户有积分账户
 *
 * 如果账户不存在则创建
 */
export async function ensureCreditsBalance(userId: string) {
  const [existing] = await db
    .select()
    .from(creditsBalance)
    .where(eq(creditsBalance.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // 创建新账户
  const [newBalance] = await db
    .insert(creditsBalance)
    .values({
      id: crypto.randomUUID(),
      userId,
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
      status: "active",
    })
    .returning();

  if (!newBalance) {
    throw new Error("创建积分账户失败");
  }

  return newBalance;
}

/**
 * 获取用户积分余额
 */
export async function getCreditsBalance(userId: string) {
  const balance = await ensureCreditsBalance(userId);
  return balance;
}

/**
 * 确保用户获得注册奖励
 *
 * 懒加载机制：
 * 1. 检查用户是否已有交易记录
 * 2. 如果没有任何交易记录，说明是新用户，发放注册奖励
 * 3. 这种方式比在注册时发放更安全，避免 Auth Hook 失败导致的问题
 *
 * @param userId 用户 ID
 * @param bonusAmount 注册奖励积分数量
 * @param expiryDays 过期天数（null 表示永不过期）
 */
export async function ensureRegistrationBonus(
  userId: string,
  bonusAmount: number,
  expiryDays: number | null
) {
  // 检查用户是否已有交易记录
  const [existingTransaction] = await db
    .select({ id: creditsTransaction.id })
    .from(creditsTransaction)
    .where(eq(creditsTransaction.userId, userId))
    .limit(1);

  // 如果已有交易记录，说明不是新用户，直接返回
  if (existingTransaction) {
    return { granted: false, reason: "User already has transactions" };
  }

  // 计算过期时间
  const expiresAt = expiryDays
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    : null;

  // 发放注册奖励
  const result = await grantCredits({
    userId,
    amount: bonusAmount,
    sourceType: "bonus",
    debitAccount: "SYSTEM:registration_bonus",
    transactionType: "registration_bonus",
    expiresAt,
    description: "新用户注册奖励",
    metadata: {
      bonusType: "registration",
      grantedAt: new Date().toISOString(),
    },
  });

  return {
    granted: true,
    ...result,
  };
}

/**
 * 发放积分
 *
 * 在事务中执行：
 * 1. 创建积分批次
 * 2. 记录交易（双重记账）
 * 3. 更新余额
 */
export async function grantCredits(params: GrantCreditsParams) {
  const {
    userId,
    amount,
    sourceType,
    debitAccount,
    transactionType,
    expiresAt = null,
    sourceRef,
    description,
    metadata,
  } = params;

  if (amount <= 0) {
    throw new Error("积分数量必须大于 0");
  }

  return await db.transaction(async (tx) => {
    // 1. 确保用户有积分账户
    const [balanceRecord] = await tx
      .select()
      .from(creditsBalance)
      .where(eq(creditsBalance.userId, userId))
      .limit(1);

    let currentBalance = balanceRecord;

    if (!currentBalance) {
      // 创建新账户
      const [newBalance] = await tx
        .insert(creditsBalance)
        .values({
          id: crypto.randomUUID(),
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          status: "active",
        })
        .returning();

      if (!newBalance) {
        throw new Error("创建积分账户失败");
      }
      currentBalance = newBalance;
    }

    // 检查账户状态
    if (currentBalance.status === "frozen") {
      throw new AccountFrozenError(userId);
    }

    // 2. 创建积分批次
    const batchId = crypto.randomUUID();
    await tx.insert(creditsBatch).values({
      id: batchId,
      userId,
      amount,
      remaining: amount,
      issuedAt: new Date(),
      expiresAt,
      status: "active",
      sourceType,
      sourceRef,
    });

    // 3. 记录交易（双重记账）
    const transactionId = crypto.randomUUID();
    const creditAccount = `WALLET:${userId}`;

    await tx.insert(creditsTransaction).values({
      id: transactionId,
      userId,
      type: transactionType,
      amount,
      debitAccount,
      creditAccount,
      description,
      metadata: {
        ...metadata,
        batchId,
        sourceRef,
      },
    });

    // 4. 更新余额
    await tx
      .update(creditsBalance)
      .set({
        balance: sql`${creditsBalance.balance} + ${amount}`,
        totalEarned: sql`${creditsBalance.totalEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(creditsBalance.userId, userId));

    return {
      batchId,
      transactionId,
      amount,
      newBalance: currentBalance.balance + amount,
    };
  });
}

/**
 * 消费积分 (FIFO)
 *
 * 核心 FIFO 逻辑：
 * 1. 获取所有活跃批次，按过期时间升序排列（最早过期的优先消费）
 * 2. 循环扣除直到满足需求
 * 3. 更新批次状态和余额
 * 4. 记录交易
 */
export async function consumeCredits(
  params: ConsumeCreditsParams
): Promise<ConsumeCreditsResult> {
  const { userId, amount, serviceName, description, metadata } = params;

  if (amount <= 0) {
    throw new Error("消费数量必须大于 0");
  }

  return await db.transaction(async (tx) => {
    // 1. 检查用户账户状态和余额
    const [balanceRecord] = await tx
      .select()
      .from(creditsBalance)
      .where(eq(creditsBalance.userId, userId))
      .limit(1);

    if (!balanceRecord) {
      throw new InsufficientCreditsError(amount, 0);
    }

    if (balanceRecord.status === "frozen") {
      throw new AccountFrozenError(userId);
    }

    if (balanceRecord.balance < amount) {
      throw new InsufficientCreditsError(amount, balanceRecord.balance);
    }

    // 2. 获取所有活跃批次（FIFO 排序）
    // 排序规则：有过期时间的按过期时间升序，无过期时间的放最后
    const now = new Date();
    const activeBatches = await tx
      .select()
      .from(creditsBatch)
      .where(
        and(
          eq(creditsBatch.userId, userId),
          eq(creditsBatch.status, "active"),
          gt(creditsBatch.remaining, 0),
          // 过滤掉已过期的批次
          or(
            isNull(creditsBatch.expiresAt),
            gt(creditsBatch.expiresAt, now)
          )
        )
      )
      .orderBy(
        // FIFO: 先过期的优先，无过期时间的按发放时间排序
        asc(creditsBatch.expiresAt),
        asc(creditsBatch.issuedAt)
      );

    // 3. FIFO 消费逻辑
    let remainingToConsume = amount;
    const consumedBatches: Array<{
      batchId: string;
      consumedFromBatch: number;
    }> = [];

    for (const batch of activeBatches) {
      if (remainingToConsume <= 0) break;

      const consumeFromThisBatch = Math.min(batch.remaining, remainingToConsume);
      const newRemaining = batch.remaining - consumeFromThisBatch;

      // 更新批次
      await tx
        .update(creditsBatch)
        .set({
          remaining: newRemaining,
          status: newRemaining === 0 ? "consumed" : "active",
          updatedAt: new Date(),
        })
        .where(eq(creditsBatch.id, batch.id));

      consumedBatches.push({
        batchId: batch.id,
        consumedFromBatch: consumeFromThisBatch,
      });

      remainingToConsume -= consumeFromThisBatch;
    }

    // 验证是否完全消费
    if (remainingToConsume > 0) {
      // 这不应该发生，因为我们已经检查了余额
      throw new InsufficientCreditsError(amount, amount - remainingToConsume);
    }

    // 4. 记录交易（双重记账）
    const transactionId = crypto.randomUUID();
    const debitAccount = `WALLET:${userId}`;
    const creditAccount = `SERVICE:${serviceName}`;

    await tx.insert(creditsTransaction).values({
      id: transactionId,
      userId,
      type: "consumption",
      amount,
      debitAccount,
      creditAccount,
      description: description ?? `消费于 ${serviceName}`,
      metadata: {
        ...metadata,
        serviceName,
        consumedBatches,
      },
    });

    // 5. 更新余额
    const newBalance = balanceRecord.balance - amount;
    await tx
      .update(creditsBalance)
      .set({
        balance: newBalance,
        totalSpent: sql`${creditsBalance.totalSpent} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(creditsBalance.userId, userId));

    return {
      success: true,
      consumedAmount: amount,
      remainingBalance: newBalance,
      transactionId,
      consumedBatches,
    };
  });
}

/**
 * 处理过期批次
 *
 * 扫描并标记所有过期的批次
 * 同时更新用户余额
 */
export async function processExpiredBatches() {
  const now = new Date();

  // 查找所有过期但仍活跃的批次
  const expiredBatches = await db
    .select()
    .from(creditsBatch)
    .where(
      and(
        eq(creditsBatch.status, "active"),
        lt(creditsBatch.expiresAt, now),
        gt(creditsBatch.remaining, 0)
      )
    );

  const results: Array<{
    batchId: string;
    userId: string;
    expiredAmount: number;
  }> = [];

  for (const batch of expiredBatches) {
    await db.transaction(async (tx) => {
      // 1. 标记批次为过期
      await tx
        .update(creditsBatch)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(creditsBatch.id, batch.id));

      // 2. 记录过期交易
      const transactionId = crypto.randomUUID();
      await tx.insert(creditsTransaction).values({
        id: transactionId,
        userId: batch.userId,
        type: "expiration",
        amount: batch.remaining,
        debitAccount: `WALLET:${batch.userId}`,
        creditAccount: "SYSTEM:expired",
        description: `批次 ${batch.id} 过期`,
        metadata: {
          batchId: batch.id,
          originalAmount: batch.amount,
          expiredAmount: batch.remaining,
          expiresAt: batch.expiresAt,
        },
      });

      // 3. 更新用户余额
      await tx
        .update(creditsBalance)
        .set({
          balance: sql`${creditsBalance.balance} - ${batch.remaining}`,
          updatedAt: new Date(),
        })
        .where(eq(creditsBalance.userId, batch.userId));

      results.push({
        batchId: batch.id,
        userId: batch.userId,
        expiredAmount: batch.remaining,
      });
    });
  }

  if (results.length > 0) {
    const totalExpired = results.reduce((sum, item) => sum + item.expiredAmount, 0);
    logEvent("credits.expired", {
      count: results.length,
      totalExpired,
    });
  }

  return results;
}

/**
 * 获取用户的活跃批次列表
 */
export async function getUserActiveBatches(userId: string) {
  const now = new Date();

  return await db
    .select()
    .from(creditsBatch)
    .where(
      and(
        eq(creditsBatch.userId, userId),
        eq(creditsBatch.status, "active"),
        gt(creditsBatch.remaining, 0),
        or(
          isNull(creditsBatch.expiresAt),
          gt(creditsBatch.expiresAt, now)
        )
      )
    )
    .orderBy(asc(creditsBatch.expiresAt), asc(creditsBatch.issuedAt));
}

/**
 * 获取用户的交易历史
 */
export async function getUserTransactions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  const { limit = 20, offset = 0 } = options ?? {};

  return await db
    .select()
    .from(creditsTransaction)
    .where(eq(creditsTransaction.userId, userId))
    .orderBy(sql`${creditsTransaction.createdAt} DESC`)
    .limit(limit)
    .offset(offset);
}

/**
 * 冻结用户积分账户
 */
export async function freezeCreditsAccount(userId: string) {
  await db
    .update(creditsBalance)
    .set({
      status: "frozen",
      updatedAt: new Date(),
    })
    .where(eq(creditsBalance.userId, userId));
}

/**
 * 解冻用户积分账户
 */
export async function unfreezeCreditsAccount(userId: string) {
  await db
    .update(creditsBalance)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(creditsBalance.userId, userId));
}
