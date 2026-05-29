/**
 * 积分消费逻辑 (FIFO)
 *
 * 核心 FIFO 逻辑：
 * 1. 获取所有活跃批次，按过期时间升序排列（最早过期的优先消费）
 * 2. 循环扣除直到满足需求
 * 3. 更新批次状态和余额
 * 4. 记录交易
 */

import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { creditsBalance, creditsBatch, creditsTransaction } from "@/db/schema";

import { AccountFrozenError, InsufficientCreditsError } from "./errors";
import type { ConsumeCreditsParams, ConsumeCreditsResult } from "./types";

export async function consumeCredits(
  params: ConsumeCreditsParams
): Promise<ConsumeCreditsResult> {
  const { userId, amount, serviceName, description, metadata } = params;

  if (amount <= 0) {
    throw new Error("消费数量必须大于 0");
  }

  return await db.transaction(async (tx) => {
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

    const now = new Date();
    const activeBatches = await tx
      .select()
      .from(creditsBatch)
      .where(
        and(
          eq(creditsBatch.userId, userId),
          eq(creditsBatch.status, "active"),
          gt(creditsBatch.remaining, 0),
          or(isNull(creditsBatch.expiresAt), gt(creditsBatch.expiresAt, now))
        )
      )
      .orderBy(asc(creditsBatch.expiresAt), asc(creditsBatch.issuedAt));

    let remainingToConsume = amount;
    const consumedBatches: Array<{
      batchId: string;
      consumedFromBatch: number;
    }> = [];

    for (const batch of activeBatches) {
      if (remainingToConsume <= 0) {
        break;
      }

      const consumeFromThisBatch = Math.min(
        batch.remaining,
        remainingToConsume
      );
      const newRemaining = batch.remaining - consumeFromThisBatch;

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

    if (remainingToConsume > 0) {
      throw new InsufficientCreditsError(amount, amount - remainingToConsume);
    }

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
