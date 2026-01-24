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
export const REGISTRATION_BONUS_CREDITS = 100;

/**
 * 订阅用户每月赠送积分数量
 */
export const MONTHLY_SUBSCRIPTION_CREDITS = 500;

/**
 * 积分过期天数（从发放日起）
 * null 表示永不过期
 */
export const CREDITS_EXPIRY_DAYS = 90;

/**
 * 积分套餐配置
 */
export const CREDIT_PACKAGES = [
  {
    id: "lite",
    name: "Lite",
    credits: 100,
    price: 9.99,
    description: "适合轻度使用",
  },
  {
    id: "standard",
    name: "Standard",
    credits: 500,
    price: 39.99,
    popular: true,
    description: "最受欢迎的选择",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 1000,
    price: 69.99,
    description: "适合重度使用",
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
