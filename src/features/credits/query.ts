/**
 * 积分查询逻辑
 */

import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { creditsBatch, creditsTransaction } from "@/db/schema";

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
        or(isNull(creditsBatch.expiresAt), gt(creditsBatch.expiresAt, now))
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
 * 获取用户交易总数
 */
export async function getUserTransactionsCount(
  userId: string
): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(creditsTransaction)
    .where(eq(creditsTransaction.userId, userId));

  return result?.count ?? 0;
}
