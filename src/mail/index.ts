/**
 * 邮件系统模块入口
 *
 * 统一导出邮件系统的所有公开 API
 */

// ============================================
// 客户端和工具导出
// ============================================

export { getResendClient, DEFAULT_FROM_EMAIL } from "./client";
export {
  sendEmail,
  sendBulkEmail,
  type SendEmailParams,
  type SendEmailResult,
} from "./utils";

// ============================================
// 邮件模板导出
// ============================================

export {
  WelcomeEmail,
  PrimaryActionEmail,
  MagicLinkEmail,
  ResetPasswordEmail,
  VerifyEmailEmail,
} from "./templates";

// ============================================
// Server Actions 导出
// ============================================

export {
  subscribeNewsletter,
  unsubscribeNewsletter,
  checkSubscriptionStatus,
} from "./actions";
