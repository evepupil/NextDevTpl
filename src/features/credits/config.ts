/**
 * 积分系统配置
 *
 * 定义积分系统的常量和套餐配置
 */

// ============================================
// 积分配置常量
// ============================================

/**
 * 注册奖励积分数量
 */
export const REGISTRATION_BONUS_CREDITS = 200;

/**
 * 订阅用户每月赠送积分数量（默认值，实际按套餐档位）
 * @deprecated 使用 SUBSCRIPTION_MONTHLY_CREDITS from payment.ts
 */
export const MONTHLY_SUBSCRIPTION_CREDITS = 7500;

/**
 * 积分过期天数（从发放日起）
 * null 表示永不过期
 *
 * 设计理念：Pay as you use - 积分永久有效，用户无需担心过期
 */
export const CREDITS_EXPIRY_DAYS = null;

/**
 * 积分包配置（一次性购买）
 *
 * 定价策略：比订阅略贵，鼓励订阅
 * - Starter 订阅 $2.99 = 4000 积分 (1338 积分/$)
 * - 积分包约 1000 积分/$（比订阅贵 25%）
 */
export const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    credits: 3000,
    price: 3,
    description: "For a quick study session",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 8000,
    price: 8,
    popular: true,
    description: "Most popular top-up",
  },
  {
    id: "premium",
    name: "Premium",
    credits: 20000,
    price: 18,
    description: "Best value credit pack",
  },
] as const;

/**
 * 积分套餐类型
 */
export type CreditPackage = (typeof CREDIT_PACKAGES)[number];

/**
 * 套餐 ID 类型
 */
export type CreditPackageId = CreditPackage["id"];
