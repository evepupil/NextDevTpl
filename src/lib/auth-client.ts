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
