/**
 * Stripe 客户端配置
 *
 * 这些配置可以在客户端使用（使用 NEXT_PUBLIC_ 前缀）
 * 价格 ID 不是敏感信息，可以安全地暴露给客户端
 */

/**
 * Stripe 价格 ID 配置
 *
 * 这些 ID 需要在 Stripe Dashboard 中创建产品和价格后获取
 * 然后在 .env.local 中配置
 */
export const STRIPE_PRICE_IDS = {
  /** Pro 月付计划 */
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "",
  /** Pro 年付计划 */
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? "",
  /** Enterprise 月付计划 */
  ENTERPRISE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? "",
  /** Enterprise 年付计划 */
  ENTERPRISE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY ?? "",
} as const;

/**
 * 获取应用的基础 URL
 */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
