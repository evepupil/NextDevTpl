/**
 * Rate Limiting 模块
 *
 * 使用 Upstash Redis 实现 API 限流
 * 如果未配置 Upstash，将跳过限流（优雅降级）
 *
 * 环境变量:
 * - UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
 * - UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST Token
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// ============================================
// 配置检查
// ============================================

/**
 * 检查 Upstash 是否已配置
 */
export function isRateLimitEnabled(): boolean {
	return !!(
		process.env.UPSTASH_REDIS_REST_URL &&
		process.env.UPSTASH_REDIS_REST_TOKEN
	);
}

// ============================================
// Redis 客户端（懒加载）
// ============================================

let redis: Redis | null = null;

function getRedis(): Redis | null {
	if (!isRateLimitEnabled()) {
		return null;
	}

	if (!redis) {
		redis = new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL!,
			token: process.env.UPSTASH_REDIS_REST_TOKEN!,
		});
	}

	return redis;
}

// ============================================
// 限流器配置
// ============================================

/**
 * 限流器缓存（避免重复创建）
 */
const limiters = new Map<string, Ratelimit>();

/**
 * 预定义的限流配置
 */
export const RateLimitConfig = {
	/** 全局 API 限流: 100 请求/分钟 */
	global: { requests: 100, window: "1m" as const },
	/** 认证 API 限流: 5 请求/分钟（防暴力破解）*/
	auth: { requests: 5, window: "1m" as const },
	/** AI API 限流: 20 请求/分钟 */
	ai: { requests: 20, window: "1m" as const },
	/** 支付 API 限流: 10 请求/分钟 */
	payment: { requests: 10, window: "1m" as const },
	/** 上传 API 限流: 30 请求/分钟 */
	upload: { requests: 30, window: "1m" as const },
	/** 严格限流: 3 请求/分钟（用于敏感操作）*/
	strict: { requests: 3, window: "1m" as const },
} as const;

export type RateLimitType = keyof typeof RateLimitConfig;

/**
 * 获取或创建限流器
 */
function getLimiter(type: RateLimitType): Ratelimit | null {
	const redisClient = getRedis();
	if (!redisClient) {
		return null;
	}

	const cached = limiters.get(type);
	if (cached) {
		return cached;
	}

	const config = RateLimitConfig[type];
	const limiter = new Ratelimit({
		redis: redisClient,
		limiter: Ratelimit.slidingWindow(config.requests, config.window),
		prefix: `ratelimit:${type}`,
		analytics: true,
	});

	limiters.set(type, limiter);
	return limiter;
}

// ============================================
// 限流检查函数
// ============================================

/**
 * 限流检查结果
 */
export interface RateLimitResult {
	/** 是否允许请求 */
	success: boolean;
	/** 剩余请求数 */
	remaining: number;
	/** 重置时间（毫秒时间戳）*/
	reset: number;
	/** 限制数 */
	limit: number;
	/** 是否跳过了限流检查（未配置时）*/
	skipped: boolean;
}

/**
 * 检查限流
 *
 * @param identifier - 唯一标识符（如 IP 或 userId）
 * @param type - 限流类型
 * @returns 限流检查结果
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(ip, "auth");
 * if (!result.success) {
 *   return new Response("Too Many Requests", { status: 429 });
 * }
 * ```
 */
export async function checkRateLimit(
	identifier: string,
	type: RateLimitType = "global"
): Promise<RateLimitResult> {
	const limiter = getLimiter(type);

	// 未配置时跳过限流
	if (!limiter) {
		return {
			success: true,
			remaining: -1,
			reset: 0,
			limit: -1,
			skipped: true,
		};
	}

	const result = await limiter.limit(identifier);

	return {
		success: result.success,
		remaining: result.remaining,
		reset: result.reset,
		limit: result.limit,
		skipped: false,
	};
}

// ============================================
// 辅助函数
// ============================================

/**
 * 从 NextRequest 获取客户端 IP
 */
export function getClientIp(request: NextRequest): string {
	// 优先使用 Vercel 提供的真实 IP
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0]?.trim() ?? "unknown";
	}

	const realIp = request.headers.get("x-real-ip");
	if (realIp) {
		return realIp;
	}

	// Cloudflare
	const cfIp = request.headers.get("cf-connecting-ip");
	if (cfIp) {
		return cfIp;
	}

	return "unknown";
}

/**
 * 生成限流响应头
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
	if (result.skipped) {
		return {};
	}

	return {
		"X-RateLimit-Limit": String(result.limit),
		"X-RateLimit-Remaining": String(result.remaining),
		"X-RateLimit-Reset": String(result.reset),
	};
}

/**
 * 创建 429 Too Many Requests 响应
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
	const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

	return new Response(
		JSON.stringify({
			error: "Too Many Requests",
			message: "请求过于频繁，请稍后再试",
			retryAfter,
		}),
		{
			status: 429,
			headers: {
				"Content-Type": "application/json",
				"Retry-After": String(retryAfter),
				...getRateLimitHeaders(result),
			},
		}
	);
}

// ============================================
// 高级 API：带限流的请求处理
// ============================================

/**
 * 限流包装器选项
 */
export interface WithRateLimitOptions {
	/** 限流类型 */
	type?: RateLimitType;
	/** 自定义标识符获取函数 */
	getIdentifier?: (request: NextRequest) => string | Promise<string>;
}

/**
 * 限流中间件包装器
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   return withRateLimit(request, { type: "auth" }, async () => {
 *     // 你的业务逻辑
 *     return NextResponse.json({ success: true });
 *   });
 * }
 * ```
 */
export async function withRateLimit<T extends Response>(
	request: NextRequest,
	options: WithRateLimitOptions,
	handler: () => Promise<T>
): Promise<T | Response> {
	const { type = "global", getIdentifier = getClientIp } = options;

	const identifier = await getIdentifier(request);
	const result = await checkRateLimit(identifier, type);

	if (!result.success) {
		return createRateLimitResponse(result);
	}

	const response = await handler();

	// 添加限流头到响应
	const headers = getRateLimitHeaders(result);
	for (const [key, value] of Object.entries(headers)) {
		response.headers.set(key, value);
	}

	return response;
}
