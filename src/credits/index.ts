/**
 * 积分系统模块入口
 *
 * 统一导出积分系统的所有公开 API
 */

// ============================================
// 配置常量导出
// ============================================

export {
  REGISTRATION_BONUS_CREDITS,
  MONTHLY_SUBSCRIPTION_CREDITS,
  CREDITS_EXPIRY_DAYS,
  CREDIT_PACKAGES,
  type CreditPackage,
  type CreditPackageId,
} from "./config";

// ============================================
// 核心函数导出
// ============================================

export {
  // 积分操作
  grantCredits,
  consumeCredits,
  processExpiredBatches,

  // 查询函数
  getCreditsBalance,
  getUserActiveBatches,
  getUserTransactions,
  ensureCreditsBalance,
  ensureRegistrationBonus,

  // 账户管理
  freezeCreditsAccount,
  unfreezeCreditsAccount,

  // 错误类型
  InsufficientCreditsError,
  AccountFrozenError,

  // 类型定义
  type GrantCreditsParams,
  type ConsumeCreditsParams,
  type ConsumeCreditsResult,
} from "./core";

// ============================================
// Server Actions 导出
// ============================================

export {
  // 公开 Actions
  grantRegistrationBonus,
  grantMonthlySubscriptionCredits,

  // 受保护 Actions
  getMyCreditsBalance,
  getMyActiveBatches,
  getMyTransactions,
  useCredits,
  checkCreditsAvailable,
  purchaseCredits,
  createCreditsPurchaseCheckout,
  getCreditPackages,
} from "./actions";

// ============================================
// UI 组件导出
// ============================================

export {
  CreditBalanceBadge,
  CreditUsageSection,
  TransactionHistory,
} from "./components";
