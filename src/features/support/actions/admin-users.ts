"use server";

import { revalidatePath } from "next/cache";
import { eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { creditsBalance, subscription, user } from "@/db/schema";
import { adminAction } from "@/lib/safe-action";
import { grantCredits } from "@/credits/core";
import { CREDITS_EXPIRY_DAYS } from "@/credits/config";

/**
 * 更新用户角色 Schema
 */
const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  role: z.enum(["user", "admin"]),
});

/**
 * 封禁/解封用户 Schema
 */
const banUserSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  banned: z.boolean(),
  reason: z.string().optional(),
});

/**
 * 手动充值积分 Schema
 */
const grantCreditsSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  amount: z.number().min(1, "积分数量必须大于0").max(100000, "单次最多充值10万积分"),
  reason: z.string().min(1, "请填写充值原因").max(200, "原因最多200字符"),
});

/**
 * 搜索用户 Schema
 */
const searchUsersSchema = z.object({
  query: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});

/**
 * 获取所有用户列表 (管理员) - 增强版
 *
 * 包含积分余额和订阅状态
 */
export const getAllUsersAction = adminAction
  .schema(searchUsersSchema.optional())
  .action(async ({ parsedInput }) => {
    const query = parsedInput?.query;

    // 构建用户选择字段
    const userSelectFields = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      bannedReason: user.bannedReason,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    // 根据是否有搜索条件构建查询
    const users = query && query.trim()
      ? await db
          .select(userSelectFields)
          .from(user)
          .where(or(ilike(user.email, `%${query.trim()}%`), ilike(user.name, `%${query.trim()}%`)))
          .orderBy(user.createdAt)
      : await db
          .select(userSelectFields)
          .from(user)
          .orderBy(user.createdAt);

    // 获取所有用户的积分余额
    const balances = await db
      .select({
        userId: creditsBalance.userId,
        balance: creditsBalance.balance,
        totalEarned: creditsBalance.totalEarned,
        totalSpent: creditsBalance.totalSpent,
        status: creditsBalance.status,
      })
      .from(creditsBalance);

    // 获取所有用户的订阅状态
    const subscriptions = await db
      .select({
        userId: subscription.userId,
        status: subscription.status,
        stripePriceId: subscription.stripePriceId,
        currentPeriodEnd: subscription.currentPeriodEnd,
      })
      .from(subscription);

    // 创建映射
    const balanceMap = new Map(balances.map((b) => [b.userId, b]));
    const subscriptionMap = new Map(subscriptions.map((s) => [s.userId, s]));

    // 合并数据
    const usersWithDetails = users.map((u) => ({
      ...u,
      credits: balanceMap.get(u.id) || null,
      subscription: subscriptionMap.get(u.id) || null,
    }));

    return { users: usersWithDetails };
  });

/**
 * 更新用户角色 (管理员)
 */
export const updateUserRoleAction = adminAction
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 防止管理员更改自己的角色
    if (data.userId === ctx.userId) {
      throw new Error("不能更改自己的角色");
    }

    // 验证用户存在
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error("用户不存在");
    }

    // 更新角色
    await db
      .update(user)
      .set({ role: data.role, updatedAt: new Date() })
      .where(eq(user.id, data.userId));

    // 刷新缓存
    revalidatePath("/admin/users");

    return {
      message: `用户角色已更新为 ${data.role === "admin" ? "管理员" : "普通用户"}`,
    };
  });

/**
 * 封禁/解封用户 (管理员)
 */
export const banUserAction = adminAction
  .schema(banUserSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 防止管理员封禁自己
    if (data.userId === ctx.userId) {
      throw new Error("不能封禁自己");
    }

    // 验证用户存在
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error("用户不存在");
    }

    // 获取目标用户 (经过上面检查，此处一定存在)
    const targetUser = userResult[0]!;

    // 不能封禁其他管理员
    if (targetUser.role === "admin" && data.banned) {
      throw new Error("不能封禁管理员账户");
    }

    // 更新封禁状态
    await db
      .update(user)
      .set({
        banned: data.banned,
        bannedReason: data.banned ? (data.reason || null) : null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, data.userId));

    // 刷新缓存
    revalidatePath("/admin/users");

    return {
      message: data.banned ? "用户已被封禁" : "用户已解除封禁",
    };
  });

/**
 * 手动充值积分 (管理员)
 */
export const adminGrantCreditsAction = adminAction
  .schema(grantCreditsSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 验证用户存在
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, data.userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error("用户不存在");
    }

    // 计算过期时间
    const expiresAt = CREDITS_EXPIRY_DAYS
      ? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
      : null;

    // 调用积分系统发放积分
    const result = await grantCredits({
      userId: data.userId,
      amount: data.amount,
      sourceType: "bonus",
      debitAccount: `ADMIN:${ctx.userId}`,
      transactionType: "registration_bonus", // 使用 bonus 类型
      expiresAt,
      sourceRef: `admin_grant_${Date.now()}`,
      description: `管理员充值: ${data.reason}`,
      metadata: {
        grantType: "admin_manual",
        adminId: ctx.userId,
        reason: data.reason,
      },
    });

    // 刷新缓存
    revalidatePath("/admin/users");

    return {
      message: `成功为用户充值 ${data.amount} 积分`,
      newBalance: result.newBalance,
    };
  });

/**
 * 获取单个用户详情 (管理员)
 */
export const getUserDetailAction = adminAction
  .schema(z.object({ userId: z.string().min(1) }))
  .action(async ({ parsedInput: { userId } }) => {
    // 获取用户基本信息
    const userResult = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      throw new Error("用户不存在");
    }

    // 获取积分余额
    const balanceResult = await db
      .select()
      .from(creditsBalance)
      .where(eq(creditsBalance.userId, userId))
      .limit(1);

    // 获取订阅状态
    const subscriptionResult = await db
      .select()
      .from(subscription)
      .where(eq(subscription.userId, userId))
      .limit(1);

    return {
      user: userResult[0],
      credits: balanceResult[0] || null,
      subscription: subscriptionResult[0] || null,
    };
  });
