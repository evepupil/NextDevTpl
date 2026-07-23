import { render, toPlainText } from "@react-email/render";
import type { ReactElement } from "react";

import type { MailAddress } from "@/core/services";
import { mailService } from "@/services/mail";

export const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM ?? "NextDevTpl <noreply@example.com>";

/**
 * 邮件发送工具
 *
 * 提供统一的邮件发送接口，支持开发环境模拟和生产环境发送
 */

// ============================================
// 类型定义
// ============================================

/**
 * 发送邮件参数
 */
export interface SendEmailParams {
  /** 收件人邮箱 (单个或数组) */
  to: string | string[];
  /** 邮件主题 */
  subject: string;
  /** React Email 组件 */
  react: ReactElement;
  /** 发件人地址 (可选，默认使用 DEFAULT_FROM_EMAIL) */
  from?: string;
  /** 抄送地址 */
  cc?: string | string[];
  /** 密送地址 */
  bcc?: string | string[];
  /** 回复地址 */
  replyTo?: string | string[];
  /** 强制发送 (开发环境下也发送真实邮件) */
  force?: boolean;
}

/**
 * 邮件发送结果
 */
export interface SendEmailResult {
  /** 是否成功 */
  success: boolean;
  /** 邮件供应商返回的邮件 ID (生产环境) */
  id?: string;
  /** 错误信息 */
  error?: string;
  /** 是否为模拟发送 (开发环境) */
  simulated?: boolean;
}

function parseMailAddress(value: string): MailAddress {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  if (!match) {
    return { email: value.trim() };
  }

  const email = match[2];
  if (!email) {
    return { email: value.trim() };
  }

  const name = match[1]?.trim();
  return name ? { email, name } : { email };
}

// ============================================
// 工具函数
// ============================================

/**
 * 判断是否为开发环境
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * 在控制台输出邮件预览信息 (开发环境)
 */
function logEmailPreview(params: SendEmailParams): void {
  const recipients = Array.isArray(params.to)
    ? params.to.join(", ")
    : params.to;

  console.log(`\n${"=".repeat(60)}`);
  console.log("📧 EMAIL PREVIEW (Development Mode)");
  console.log("=".repeat(60));
  console.log(`To:      ${recipients}`);
  console.log(`From:    ${params.from ?? DEFAULT_FROM_EMAIL}`);
  console.log(`Subject: ${params.subject}`);
  if (params.cc) {
    console.log(
      `CC:      ${Array.isArray(params.cc) ? params.cc.join(", ") : params.cc}`
    );
  }
  if (params.bcc) {
    console.log(
      `BCC:     ${Array.isArray(params.bcc) ? params.bcc.join(", ") : params.bcc}`
    );
  }
  if (params.replyTo) {
    console.log(
      `Reply:   ${Array.isArray(params.replyTo) ? params.replyTo.join(", ") : params.replyTo}`
    );
  }
  console.log("-".repeat(60));
  console.log("💡 Set force: true to send real email in development");
  console.log(`${"=".repeat(60)}\n`);
}

// ============================================
// 核心函数
// ============================================

/**
 * 发送邮件
 *
 * 主要特性:
 * - 开发环境默认只输出日志，不发送真实邮件
 * - 通过 force: true 可在开发环境发送真实邮件
 * - 生产环境始终发送真实邮件
 * - 完善的错误处理
 *
 * @example
 * ```ts
 * // 发送欢迎邮件
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome to NextDevTpl!",
 *   react: <WelcomeEmail name="John" dashboardUrl="..." />,
 * });
 *
 * // 开发环境强制发送
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Test Email",
 *   react: <TestEmail />,
 *   force: true,
 * });
 * ```
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, react, from, cc, bcc, replyTo, force = false } = params;

  // 开发环境且未强制发送 -> 模拟发送
  if (isDevelopment() && !force) {
    logEmailPreview(params);
    return {
      success: true,
      simulated: true,
    };
  }

  // 真实发送邮件
  try {
    const html = await render(react);
    const result = await mailService.send({
      from: parseMailAddress(from ?? DEFAULT_FROM_EMAIL),
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: toPlainText(html),
      ...(cc ? { cc: Array.isArray(cc) ? cc : [cc] } : {}),
      ...(bcc ? { bcc: Array.isArray(bcc) ? bcc : [bcc] } : {}),
      ...(replyTo
        ? { replyTo: Array.isArray(replyTo) ? replyTo : [replyTo] }
        : {}),
    });

    return {
      success: true,
      ...(result.id ? { id: result.id } : {}),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Email sending error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
