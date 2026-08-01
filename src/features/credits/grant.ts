/**
 * 积分发放逻辑
 *
 * 在事务中执行：
 * 1. 创建积分批次
 * 2. 记录交易（双重记账）
 * 3. 更新余额
 */

import { and, eq, sql } from "drizzle-orm";

import { db, withDbTransaction } from "@/db";
import {
  creditsBalance,
  creditsBatch,
  creditsTransaction,
} from "@/db/schema/credits";

import { AccountFrozenError } from "./errors";
import type { GrantCreditsParams, GrantCreditsResult } from "./types";

type RegistrationBonusResult =
  | { granted: false; reason: string }
  | (GrantCreditsResult & { granted: true });

/**
 * 发放积分
 */
export async function grantCredits(
  params: GrantCreditsParams
): Promise<GrantCreditsResult> {
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

  return await withDbTransaction(async (tx) => {
    const [balanceRecord] = await tx
      .select()
      .from(creditsBalance)
      .where(eq(creditsBalance.userId, userId))
      .for("update")
      .limit(1);

    let currentBalance = balanceRecord;

    if (!currentBalance) {
      await tx
        .insert(creditsBalance)
        .values({
          id: crypto.randomUUID(),
          userId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          status: "active",
        })
        .onConflictDoNothing({ target: creditsBalance.userId });

      const [newBalance] = await tx
        .select()
        .from(creditsBalance)
        .where(eq(creditsBalance.userId, userId))
        .for("update")
        .limit(1);

      if (!newBalance) {
        throw new Error("创建积分账户失败");
      }

      currentBalance = newBalance;
    }

    if (currentBalance.status === "frozen") {
      throw new AccountFrozenError(userId);
    }

    const batchValues = {
      id: crypto.randomUUID(),
      userId,
      amount,
      remaining: amount,
      issuedAt: new Date(),
      expiresAt,
      status: "active" as const,
      sourceType,
      sourceRef,
    };
    const [insertedBatch] = await tx
      .insert(creditsBatch)
      .values(batchValues)
      .onConflictDoNothing()
      .returning();

    if (!insertedBatch && sourceRef) {
      const [existingBatch] = await tx
        .select({ id: creditsBatch.id })
        .from(creditsBatch)
        .where(
          and(
            eq(creditsBatch.userId, userId),
            eq(creditsBatch.sourceType, sourceType),
            eq(creditsBatch.sourceRef, sourceRef)
          )
        )
        .limit(1);

      if (existingBatch) {
        return {
          batchId: existingBatch.id,
          transactionId: "",
          amount: 0,
          newBalance: currentBalance.balance,
          granted: false,
        };
      }
    }

    if (!insertedBatch) {
      throw new Error("创建积分批次失败");
    }

    const batchId = insertedBatch.id;

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

    const [updatedBalance] = await tx
      .update(creditsBalance)
      .set({
        balance: sql`${creditsBalance.balance} + ${amount}`,
        totalEarned: sql`${creditsBalance.totalEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(creditsBalance.userId, userId))
      .returning({ balance: creditsBalance.balance });

    return {
      batchId,
      transactionId,
      amount,
      newBalance: updatedBalance?.balance ?? currentBalance.balance + amount,
      granted: true,
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
): Promise<RegistrationBonusResult> {
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
    sourceRef: `registration:${userId}`,
    description: "新用户注册奖励",
    metadata: {
      bonusType: "registration",
      grantedAt: new Date().toISOString(),
    },
  });

  if (!result.granted) {
    return { granted: false, reason: "User already has transactions" };
  }

  return { ...result, granted: true };
}
