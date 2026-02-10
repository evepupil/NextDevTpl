import { headers } from "next/headers";

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
export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
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
