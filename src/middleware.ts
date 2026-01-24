import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";

/**
 * 创建国际化中间件
 */
const intlMiddleware = createIntlMiddleware(routing);

/**
 * 中间件配置
 *
 * 功能:
 * 1. 国际化路由处理 (next-intl)
 * 2. 认证保护 (Better Auth)
 *    - /dashboard/* 需要登录才能访问
 *    - 未登录用户将被重定向到 /sign-in
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 获取 Better Auth 的 session token
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // 从路径中提取不带语言前缀的路径
  // 例如: /en/dashboard -> /dashboard, /zh/sign-in -> /sign-in
  const pathnameWithoutLocale = pathname.replace(/^\/(en|zh)/, "") || "/";

  // 定义需要保护的路由
  const protectedRoutes = ["/dashboard"];

  // 定义认证页面路由 (已登录用户不应访问)
  const authRoutes = ["/sign-in", "/sign-up"];

  // 检查当前路径是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // 检查当前路径是否是认证页面
  const isAuthRoute = authRoutes.some(
    (route) => pathnameWithoutLocale === route
  );

  // 获取当前语言前缀 (用于重定向)
  const localeMatch = pathname.match(/^\/(en|zh)/);
  const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

  // 如果访问受保护路由但未登录，重定向到登录页
  if (isProtectedRoute && !sessionToken) {
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    // 保存原始 URL，登录后可以重定向回来
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 如果已登录用户访问认证页面，重定向到 Dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // 执行国际化中间件
  return intlMiddleware(request);
}

/**
 * 中间件匹配配置
 * 排除静态文件和 API 路由
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
