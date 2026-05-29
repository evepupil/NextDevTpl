/**
 * 积分过期处理
 *
 * 扫描并标记所有过期的批次，同时更新用户余额。
 * 使用条件更新保证同一批次在并发运行时只会被处理一次。
 */

import { and, eq, gt, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { creditsBalance, creditsBatch, creditsTransaction } from "@/db/schema";
import { logEvent } from "@/lib/logger";

export async function processExpiredBatches() {
  const now = new Date();

  const expiredBatches = await db
    .select({
      id: creditsBatch.id,
    })
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
      const [expiredBatch] = await tx
        .update(creditsBatch)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(creditsBatch.id, batch.id),
            eq(creditsBatch.status, "active"),
            gt(creditsBatch.remaining, 0)
          )
        )
        .returning({
          id: creditsBatch.id,
          userId: creditsBatch.userId,
          amount: creditsBatch.amount,
          remaining: creditsBatch.remaining,
          expiresAt: creditsBatch.expiresAt,
        });

      if (!expiredBatch) {
        return;
      }

      const transactionId = crypto.randomUUID();
      await tx.insert(creditsTransaction).values({
        id: transactionId,
        userId: expiredBatch.userId,
        type: "expiration",
        amount: expiredBatch.remaining,
        debitAccount: `WALLET:${expiredBatch.userId}`,
        creditAccount: "SYSTEM:expired",
        description: `批次 ${expiredBatch.id} 过期`,
        metadata: {
          batchId: expiredBatch.id,
          originalAmount: expiredBatch.amount,
          expiredAmount: expiredBatch.remaining,
          expiresAt: expiredBatch.expiresAt,
        },
      });

      await tx
        .update(creditsBalance)
        .set({
          balance: sql`${creditsBalance.balance} - ${expiredBatch.remaining}`,
          updatedAt: new Date(),
        })
        .where(eq(creditsBalance.userId, expiredBatch.userId));

      results.push({
        batchId: expiredBatch.id,
        userId: expiredBatch.userId,
        expiredAmount: expiredBatch.remaining,
      });
    });
  }

  if (results.length > 0) {
    const totalExpired = results.reduce(
      (sum, item) => sum + item.expiredAmount,
      0
    );
    logEvent("credits.expired", {
      count: results.length,
      totalExpired,
    });
  }

  return results;
}
