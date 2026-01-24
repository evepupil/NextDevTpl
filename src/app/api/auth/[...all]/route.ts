import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/index";

/**
 * Better Auth API 路由处理器
 *
 * 此文件处理所有 /api/auth/* 请求
 * Better Auth 自动处理:
 * - /api/auth/sign-in - 登录
 * - /api/auth/sign-up - 注册
 * - /api/auth/sign-out - 登出
 * - /api/auth/session - 获取会话
 * - /api/auth/callback/* - OAuth 回调
 * - 等等...
 */
export const { GET, POST } = toNextJsHandler(auth);
