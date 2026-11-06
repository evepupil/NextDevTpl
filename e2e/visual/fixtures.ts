/**
 * 截图专用的固定假数据
 *
 * 种子数据和截图服务器的环境变量共用这些值：
 * 订阅记录里的价格 ID 必须和服务器认的价格 ID 一模一样，页面才会把订阅识别成 Pro 月付。
 */

/** 各档位的假价格 ID，值随意，但必须固定且互不相同 */
export const VISUAL_PRICE_IDS = {
  proMonthly: "visual_price_pro_monthly",
  proYearly: "visual_price_pro_yearly",
  starterMonthly: "visual_price_starter_monthly",
  starterYearly: "visual_price_starter_yearly",
  ultraMonthly: "visual_price_ultra_monthly",
  ultraYearly: "visual_price_ultra_yearly",
} as const;

/** 服务器读取价格 ID 的环境变量名（见 src/config/payment.ts） */
export const VISUAL_PRICE_ENV = {
  NEXT_PUBLIC_PRICE_PRO_MONTHLY: VISUAL_PRICE_IDS.proMonthly,
  NEXT_PUBLIC_PRICE_PRO_YEARLY: VISUAL_PRICE_IDS.proYearly,
  NEXT_PUBLIC_PRICE_STARTER_MONTHLY: VISUAL_PRICE_IDS.starterMonthly,
  NEXT_PUBLIC_PRICE_STARTER_YEARLY: VISUAL_PRICE_IDS.starterYearly,
  NEXT_PUBLIC_PRICE_ULTRA_MONTHLY: VISUAL_PRICE_IDS.ultraMonthly,
  NEXT_PUBLIC_PRICE_ULTRA_YEARLY: VISUAL_PRICE_IDS.ultraYearly,
} as const;

/** 支付供应商侧的订阅和客户编号（只存库，不会真的请求供应商） */
export const VISUAL_PROVIDER = {
  customerId: "cust_visual_0001",
  subscriptionId: "sub_visual_0001",
} as const;

/** 测试用的认证密钥，至少 32 位；只在截图服务器里使用 */
export const VISUAL_AUTH_SECRET =
  "visual-baseline-auth-secret-0123456789abcdef";
