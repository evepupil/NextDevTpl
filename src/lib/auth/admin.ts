import { getLocale } from "next-intl/server";

import { getServerSession } from "@/lib/auth/server";
import { redirectWithLocale } from "@/lib/locale-redirect";

/**
 * Admin 权限检查
 *
 * 用于保护管理员路由
 * 如果用户未登录或不是管理员，重定向到首页
 *
 * @returns 当前用户会话 (如果是管理员)
 * @throws Redirect to "/" if not admin
 *
 * @example
 * ```ts
 * // 在 Admin 布局或页面中使用
 * export default async function AdminLayout({ children }) {
 *   await checkAdmin();
 *   return <>{children}</>;
 * }
 * ```
 */
export async function checkAdmin() {
  const session = await getServerSession();
  const locale = (await getLocale()) as "en" | "zh";

  // 检查用户是否登录
  if (!session || !session.user) {
    await redirectWithLocale("/sign-in", locale);
    throw new Error("未登录");
  }

  // 检查用户是否是管理员
  if (session.user.role !== "admin") {
    await redirectWithLocale("/", locale);
    throw new Error("需要管理员权限");
  }

  return session;
}

/**
 * 检查当前用户是否是管理员 (不重定向)
 *
 * 用于需要检查管理员权限但不想重定向的场景
 *
 * @returns 是否是管理员
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();

  if (!session || !session.user) {
    return false;
  }

  return session.user.role === "admin";
}
