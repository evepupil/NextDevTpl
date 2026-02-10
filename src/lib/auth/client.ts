"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth 客户端配置
 *
 * 此客户端用于在 React 组件中进行认证操作:
 * - 社交登录 (GitHub, Google)
 * - 邮箱密码登录
 * - 会话管理
 * - 登出
 */
export const authClient = createAuthClient({
  /**
   * 认证 API 基础 URL
   * 默认指向 /api/auth，与 API 路由匹配
   */
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

/**
 * 导出常用的认证方法，便于在组件中使用
 */
export const {
  // 会话相关
  useSession, // Hook: 获取当前会话状态
  getSession, // 函数: 获取会话 (非 Hook)

  // 登录方法
  signIn, // 登录 (邮箱密码或社交)

  // 登出方法
  signOut, // 登出当前会话

  // 注册方法
  signUp, // 注册新用户 (邮箱密码)
} = authClient;

/**
 * 发送密码重置邮件
 * 通过调用 Better Auth API 端点发送重置链接
 * @param email - 用户邮箱
 * @param redirectTo - 重置链接的跳转地址
 */
export async function forgetPassword(email: string, redirectTo = "/reset-password") {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseURL}/api/auth/forget-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      redirectTo,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send reset email");
  }

  return response.json();
}

/**
 * 重置密码
 * @param newPassword - 新密码
 * @param token - 重置令牌 (从 URL 获取)
 */
export async function resetPassword(newPassword: string, token: string) {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseURL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      newPassword,
      token,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to reset password");
  }

  return response.json();
}

/**
 * 社交登录辅助函数
 */

/**
 * 使用 GitHub 登录
 * @param callbackURL - 登录成功后的跳转地址
 */
export async function signInWithGitHub(callbackURL = "/dashboard") {
  return signIn.social({
    provider: "github",
    callbackURL,
  });
}

/**
 * 使用 Google 登录
 * @param callbackURL - 登录成功后的跳转地址
 */
export async function signInWithGoogle(callbackURL = "/dashboard") {
  return signIn.social({
    provider: "google",
    callbackURL,
  });
}

/**
 * 邮箱密码登录
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @param callbackURL - 登录成功后的跳转地址
 */
export async function signInWithEmail(
  email: string,
  password: string,
  callbackURL = "/dashboard"
) {
  return signIn.email({
    email,
    password,
    callbackURL,
  });
}

/**
 * 邮箱密码注册
 * @param email - 用户邮箱
 * @param password - 用户密码
 * @param name - 用户名称
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
) {
  return signUp.email({
    email,
    password,
    name,
  });
}

/**
 * 修改密码（已登录用户）
 * @param currentPassword - 当前密码
 * @param newPassword - 新密码
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseURL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to change password");
  }

  return data;
}

/**
 * 重新发送邮箱验证邮件
 * @param email - 用户邮箱
 */
export async function resendVerificationEmail(email: string) {
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseURL}/api/auth/send-verification-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error("Failed to send verification email");
  }

  return response.json();
}

/**
 * 刷新会话
 * 用于在会话数据更新后强制刷新客户端状态
 */
export async function reloadSession() {
  return getSession();
}
