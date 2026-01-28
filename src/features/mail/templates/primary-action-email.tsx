import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import type { ReactNode } from "react";

/**
 * 通用操作邮件模板
 *
 * 用于需要用户执行某个操作的邮件场景：
 * - 重置密码
 * - Magic Link 登录
 * - 邮箱验证
 * - 邀请确认
 */

interface PrimaryActionEmailProps {
  /** 预览文本 (显示在收件箱列表中) */
  preview?: string;
  /** 操作按钮文本 */
  actionLabel: string;
  /** 操作链接 */
  actionUrl: string;
  /** 邮件正文内容 */
  children: ReactNode;
  /** 链接有效期提示 (可选) */
  expiresIn?: string;
}

/**
 * 通用操作邮件组件
 */
export function PrimaryActionEmail({
  preview,
  actionLabel,
  actionUrl,
  children,
  expiresIn,
}: PrimaryActionEmailProps) {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 max-w-xl rounded-lg border border-solid border-gray-200 p-8">
            {/* Logo / 品牌区域 */}
            <Section className="mb-8 text-center">
              <Heading className="m-0 text-2xl font-bold text-gray-900">
                NextDevTpl
              </Heading>
            </Section>

            {/* 正文内容 (通过 children 传入) */}
            <Section className="mb-6">{children}</Section>

            {/* CTA 按钮 */}
            <Section className="mb-6 text-center">
              <Button
                href={actionUrl}
                className="inline-block rounded-md bg-violet-600 px-6 py-3 text-center text-sm font-semibold text-white no-underline"
              >
                {actionLabel}
              </Button>
            </Section>

            {/* 链接有效期提示 */}
            {expiresIn && (
              <Text className="mb-4 text-center text-sm text-gray-500">
                This link will expire in {expiresIn}.
              </Text>
            )}

            {/* 备用链接 */}
            <Section className="mb-6 rounded-lg bg-gray-50 p-4">
              <Text className="m-0 mb-2 text-xs text-gray-600">
                If the button above doesn&apos;t work, copy and paste this URL
                into your browser:
              </Text>
              <Text className="m-0 break-all text-xs text-violet-600">
                {actionUrl}
              </Text>
            </Section>

            <Hr className="my-6 border-gray-200" />

            {/* 安全提示 */}
            <Text className="m-0 text-center text-xs text-gray-500">
              If you didn&apos;t request this email, you can safely ignore it.
            </Text>

            {/* 页脚 */}
            <Text className="m-0 mt-4 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} NextDevTpl. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/**
 * 默认导出 - 用于 React Email 预览
 */
export default PrimaryActionEmail;

// ============================================
// 预定义的邮件变体
// ============================================

/**
 * Magic Link 登录邮件
 */
export function MagicLinkEmail({
  magicLinkUrl,
  email,
}: {
  magicLinkUrl: string;
  email: string;
}) {
  return (
    <PrimaryActionEmail
      preview="Sign in to NextDevTpl with this magic link"
      actionLabel="Sign In"
      actionUrl={magicLinkUrl}
      expiresIn="15 minutes"
    >
      <Heading className="mb-4 text-xl font-semibold text-gray-900">
        Sign in to NextDevTpl
      </Heading>
      <Text className="mb-4 text-base leading-relaxed text-gray-600">
        Click the button below to sign in to your account ({email}). No password
        required!
      </Text>
    </PrimaryActionEmail>
  );
}

/**
 * 重置密码邮件
 */
export function ResetPasswordEmail({
  resetUrl,
  name,
}: {
  resetUrl: string;
  name: string;
}) {
  return (
    <PrimaryActionEmail
      preview="Reset your NextDevTpl password"
      actionLabel="Reset Password"
      actionUrl={resetUrl}
      expiresIn="1 hour"
    >
      <Heading className="mb-4 text-xl font-semibold text-gray-900">
        Reset Your Password
      </Heading>
      <Text className="mb-4 text-base leading-relaxed text-gray-600">
        Hi {name}, we received a request to reset your password. Click the
        button below to create a new password.
      </Text>
    </PrimaryActionEmail>
  );
}

/**
 * 邮箱验证邮件
 */
export function VerifyEmailEmail({
  verifyUrl,
  name,
}: {
  verifyUrl: string;
  name: string;
}) {
  return (
    <PrimaryActionEmail
      preview="Verify your email address"
      actionLabel="Verify Email"
      actionUrl={verifyUrl}
      expiresIn="24 hours"
    >
      <Heading className="mb-4 text-xl font-semibold text-gray-900">
        Verify Your Email
      </Heading>
      <Text className="mb-4 text-base leading-relaxed text-gray-600">
        Hi {name}, please verify your email address by clicking the button
        below. This helps us keep your account secure.
      </Text>
    </PrimaryActionEmail>
  );
}

/**
 * 预览 Props
 */
PrimaryActionEmail.PreviewProps = {
  preview: "Complete this action",
  actionLabel: "Click Here",
  actionUrl: "https://nextdevtpl.com/action",
  children: (
    <>
      <Heading className="mb-4 text-xl font-semibold text-gray-900">
        Action Required
      </Heading>
      <Text className="mb-4 text-base leading-relaxed text-gray-600">
        This is a sample email that requires you to take an action. Click the
        button below to continue.
      </Text>
    </>
  ),
  expiresIn: "24 hours",
} satisfies PrimaryActionEmailProps;
