import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/db";
import * as schema from "@/db/schema";

/**
 * Better Auth 服务端配置
 *
 * 此文件配置 Better Auth 的核心功能:
 * - 数据库适配器 (Drizzle + PostgreSQL)
 * - OAuth 提供商 (GitHub, Google)
 * - 会话配置
 */
export const auth = betterAuth({
  /**
   * 基础 URL 配置
   * 用于 OAuth 回调和邮件链接
   */
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  /**
   * 信任的来源
   * 允许从这些来源发起认证请求
   */
  trustedOrigins: ["http://localhost:3000"],

  /**
   * 数据库配置
   * 使用 Drizzle 适配器连接 PostgreSQL
   */
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  /**
   * 邮箱密码认证配置
   */
  emailAndPassword: {
    enabled: true,
    // 要求邮箱验证 (可选，生产环境建议开启)
    // requireEmailVerification: true,
  },

  /**
   * OAuth 社交登录提供商配置
   * 需要在 .env 中配置相应的 Client ID 和 Secret
   */
  socialProviders: {
    /**
     * GitHub OAuth 配置
     * 获取凭证: https://github.com/settings/developers
     */
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      // 请求完整的用户信息和邮箱权限
      scope: ["read:user", "user:email"],
      // 当 GitHub 不返回邮箱时，使用 noreply 邮箱作为后备
      mapProfileToUser(profile) {
        return {
          email:
            profile.email ||
            `${profile.id}+${profile.login}@users.noreply.github.com`,
          name: profile.name || profile.login,
          image: profile.avatar_url,
          emailVerified: !!profile.email,
        };
      },
    },

    /**
     * Google OAuth 配置
     * 获取凭证: https://console.cloud.google.com/apis/credentials
     */
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  /**
   * 会话配置
   */
  session: {
    // 会话过期时间: 7 天
    expiresIn: 60 * 60 * 24 * 7,
    // 刷新阈值: 1 天 (会话剩余不足 1 天时自动刷新)
    updateAge: 60 * 60 * 24,
    // 使用 Cookie 存储会话
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 分钟缓存
    },
  },
});

/**
 * 导出类型以供客户端使用
 */
export type Auth = typeof auth;
