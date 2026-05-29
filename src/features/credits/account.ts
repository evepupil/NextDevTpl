/**
 * 积分账户管理
 */

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { creditsBalance } from "@/db/schema";

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
  return await ensureCreditsBalance(userId);
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
