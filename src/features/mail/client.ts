import { Resend } from "resend";

/**
 * Resend 邮件客户端
 *
 * 用于发送事务性邮件
 * 需要配置 RESEND_API_KEY 环境变量
 */

/**
 * 获取 Resend 客户端实例
 *
 * 使用懒加载模式，只在需要时创建实例
 */
function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }

  return new Resend(apiKey);
}

/**
 * Resend 客户端单例
 */
let resendClient: Resend | null = null;

/**
 * 获取 Resend 客户端
 *
 * 单例模式，确保只创建一个客户端实例
 */
export function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = createResendClient();
  }
  return resendClient;
}

/**
 * 默认发件人地址
 *
 * 可以通过环境变量 EMAIL_FROM 配置
 * 格式: "Name <email@domain.com>"
 */
export const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM ?? "NextDevTpl <noreply@nextdevtpl.com>";
