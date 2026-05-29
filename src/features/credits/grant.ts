/**
 * 积分发放逻辑
 *
 * 在事务中执行：
 * 1. 创建积分批次
 * 2. 记录交易（双重记账）
 * 3. 更新余额
 */

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { creditsBalance, creditsBatch, creditsTransaction } from "@/db/schema";

import { AccountFrozenError } from "./errors";
import type { GrantCreditsParams } from "./types";

/**
 * 发放积分
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
    const [balanceRecord] = await tx
      .select()
      .from(creditsBalance)
      .where(eq(creditsBalance.userId, userId))
      .limit(1);

    let currentBalance = balanceRecord;

    if (!currentBalance) {
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

    if (currentBalance.status === "frozen") {
      throw new AccountFrozenError(userId);
    }

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
 * 确保用户获得注册奖励
 *
 * 懒加载机制：
 * 1. 检查用户是否已有交易记录
 * 2. 如果没有任何交易记录，说明是新用户，发放注册奖励
 */
export async function ensureRegistrationBonus(
  userId: string,
  bonusAmount: number,
  expiryDays: number | null
) {
  const [existingTransaction] = await db
    .select({ id: creditsTransaction.id })
    .from(creditsTransaction)
    .where(eq(creditsTransaction.userId, userId))
    .limit(1);

  if (existingTransaction) {
    return { granted: false, reason: "User already has transactions" };
  }

  const expiresAt = expiryDays
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    : null;

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
