/**
 * 用户订阅计划服务
 *
 * 提供获取用户当前计划和检查特权的功能
 */

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { subscription } from "@/db/schema";
import {
  type SubscriptionPlan,
  getPlanFromPriceId,
  getPlanPrivileges,
  isWithinFileSizeLimit,
  formatFileSizeLimit,
  getUpgradeMessage,
} from "@/config/subscription-plan";

// ============================================
// 类型定义
// ============================================

/**
 * 用户计划信息
 */
export interface UserPlanInfo {
  /** 当前计划 */
  plan: SubscriptionPlan;
  /** 计划名称 */
  planName: string;
  /** 是否有活跃订阅 */
  hasActiveSubscription: boolean;
  /** 订阅状态 */
  subscriptionStatus: string | null;
  /** 当前周期结束时间（续期日期） */
  currentPeriodEnd: Date | null;
  /** 价格 ID（用于查找价格信息） */
  priceId: string | null;
  /** 是否在周期结束时取消 */
  cancelAtPeriodEnd: boolean;
}

/**
 * 特权检查结果
 */
export interface PrivilegeCheckResult {
  /** 是否允许 */
  allowed: boolean;
  /** 错误消息（如果不允许） */
  errorMessage?: string;
  /** 升级建议（如果不允许） */
  upgradeMessage?: string;
}

// ============================================
// 核心服务函数
// ============================================

/**
 * 获取用户当前订阅计划
 *
 * 从 subscription 表查询 priceId 并映射到计划类型
 * 如果没有活跃订阅，返回 "free"
 *
 * @param userId - 用户 ID
 * @returns 用户计划信息
 */
export async function getUserPlan(userId: string): Promise<UserPlanInfo> {
  // 查询用户的活跃订阅
  const [userSubscription] = await db
    .select({
      priceId: subscription.priceId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    })
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .limit(1);

  // 检查订阅是否有效
  const isCanceledButStillActive =
    userSubscription?.status === "canceled" &&
    userSubscription.currentPeriodEnd &&
    new Date(userSubscription.currentPeriodEnd) > new Date();

  const isActive =
    userSubscription &&
    (["active", "trialing", "lifetime"].includes(userSubscription.status) ||
      isCanceledButStillActive);

  if (!isActive || !userSubscription) {
    return {
      plan: "free",
      planName: "Free",
      hasActiveSubscription: false,
      subscriptionStatus: userSubscription?.status ?? null,
      currentPeriodEnd: null,
      priceId: null,
      cancelAtPeriodEnd: false,
    };
  }

  // 判断是否处于"已取消待到期"状态
  const effectiveCancelAtPeriodEnd =
    isCanceledButStillActive || userSubscription.cancelAtPeriodEnd;

  // 从 priceId 映射到计划
  const plan = getPlanFromPriceId(userSubscription.priceId);

  if (!plan) {
    console.warn(
      `Unknown priceId: ${userSubscription.priceId} for user ${userId}`,
    );
    return {
      plan: "free",
      planName: "Free",
      hasActiveSubscription: true,
      subscriptionStatus: userSubscription.status,
      currentPeriodEnd: userSubscription.currentPeriodEnd,
      priceId: userSubscription.priceId,
      cancelAtPeriodEnd: effectiveCancelAtPeriodEnd,
    };
  }

  const privileges = getPlanPrivileges(plan);

  return {
    plan,
    planName: privileges.name,
    hasActiveSubscription: true,
    subscriptionStatus: userSubscription.status,
    currentPeriodEnd: userSubscription.currentPeriodEnd,
    priceId: userSubscription.priceId,
    cancelAtPeriodEnd: effectiveCancelAtPeriodEnd,
  };
}

/**
 * 获取用户计划类型（简化版，仅返回计划类型）
 *
 * @param userId - 用户 ID
 * @returns 计划类型
 */
export async function getUserPlanType(
  userId: string,
): Promise<SubscriptionPlan> {
  const { plan } = await getUserPlan(userId);
  return plan;
}

// ============================================
// 特权检查函数
// ============================================

/**
 * 检查文件大小是否在用户计划限制内
 *
 * @param userId - 用户 ID
 * @param fileSizeBytes - 文件大小（字节）
 * @returns 检查结果
 */
export async function checkFileSizePrivilege(
  userId: string,
  fileSizeBytes: number,
): Promise<PrivilegeCheckResult> {
  const { plan } = await getUserPlan(userId);

  if (isWithinFileSizeLimit(plan, fileSizeBytes)) {
    return { allowed: true };
  }

  const limit = formatFileSizeLimit(plan);
  const actualSize = `${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB`;

  return {
    allowed: false,
    errorMessage: `File size (${actualSize}) exceeds ${limit} limit for your plan.`,
    upgradeMessage: getUpgradeMessage(plan, `Files over ${limit}`),
  };
}
