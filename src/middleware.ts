import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import {
	checkRateLimit,
	createRateLimitResponse,
	getClientIp,
	getRateLimitHeaders,
	type RateLimitType,
} from "@/lib/rate-limit";

/**
 * 创建国际化中间件
 */
const intlMiddleware = createIntlMiddleware(routing);

/**
 * API 路由限流配置
 *
 * 根据路由模式匹配不同的限流策略
 */
const API_RATE_LIMITS: Array<{ pattern: RegExp; type: RateLimitType }> = [
	// 认证相关 - 严格限流防暴力破解
	{ pattern: /^\/api\/auth\//, type: "auth" },
	// AI 相关
	{ pattern: /^\/api\/ai\//, type: "ai" },
	// 支付相关
	{ pattern: /^\/api\/(webhooks\/(stripe|creem)|payment)/, type: "payment" },
	// 上传相关
	{ pattern: /^\/api\/upload/, type: "upload" },
];

/**
 * 获取 API 路由的限流类型
 */
function getApiRateLimitType(pathname: string): RateLimitType {
	for (const { pattern, type } of API_RATE_LIMITS) {
		if (pattern.test(pathname)) {
			return type;
		}
	}
	return "global";
}

/**
 * 中间件配置
 *
 * 功能:
 * 1. API 限流（全局 + 路由级别）
 * 2. 国际化路由处理 (next-intl)
 * 3. 认证保护 (Better Auth)
 *    - /dashboard/* 需要登录才能访问
 *    - 未登录用户将被重定向到 /sign-in
 */
export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// ============================================
	// API 路由限流
	// ============================================
	if (pathname.startsWith("/api/")) {
		// 跳过健康检查和 webhook 验证请求（让业务逻辑处理）
		// Webhook 需要验证签名，不应被限流阻断
		if (
			pathname === "/api/health" ||
			pathname === "/api/webhooks/stripe" ||
			pathname === "/api/webhooks/creem"
		) {
			return NextResponse.next();
		}

		const ip = getClientIp(request);
		const rateLimitType = getApiRateLimitType(pathname);
		const result = await checkRateLimit(ip, rateLimitType);

		if (!result.success) {
			return createRateLimitResponse(result);
		}

		// 继续处理请求，添加限流头
		const response = NextResponse.next();
		const headers = getRateLimitHeaders(result);
		for (const [key, value] of Object.entries(headers)) {
			response.headers.set(key, value);
		}
		return response;
	}

	// ============================================
	// 非 API 路由：国际化 + 认证保护
	// ============================================

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
 *
 * 现在也匹配 API 路由，以便进行全局限流
 */
export const config = {
	matcher: [
		/*
		 * 匹配所有路径除了:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 *
		 * 注意: 现在包含 /api 路由以便进行限流
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
	],
};
