import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { user as userTable } from "@/db/schema/auth";

import { auth } from "./index";

/**
 * 服务器端获取当前用户会话
 *
 * 用于 Server Components 和 Server Actions 中获取用户信息
 *
 * @example
 * ```tsx
 * // 在 Server Component 中使用
 * export default async function Page() {
 *   const session = await getServerSession();
 *   if (!session) {
 *     redirect("/sign-in");
 *   }
 *   return <div>Welcome, {session.user.name}</div>;
 * }
 * ```
 */
export async function getServerSession(requestHeaders?: Headers) {
  const session = await auth.api.getSession({
    headers: requestHeaders ?? (await headers()),
  });

  if (!session?.user) {
    return null;
  }

  // Better Auth 的会话缓存可能短暂保留旧用户字段。每次服务端授权前
  // 重新读取封禁状态，确保旧会话也会立即失效。
  const [currentUser] = await db
    .select({
      role: userTable.role,
      banned: userTable.banned,
      bannedReason: userTable.bannedReason,
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (!currentUser || currentUser.banned) {
    return null;
  }

  return {
    ...session,
    user: {
      ...session.user,
      ...currentUser,
    },
  };
}

/**
 * 获取当前用户
 *
 * 便捷方法，直接返回用户对象或 null
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}

/**
 * 检查用户是否已认证
 *
 * @returns boolean - 用户是否已登录
 */
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session?.user;
}
