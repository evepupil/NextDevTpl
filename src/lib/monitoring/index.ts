/**
 * 错误监控模块
 *
 * 使用 Sentry 实现错误监控和性能追踪
 * 未配置时跳过所有 Sentry 操作（优雅降级）
 *
 * 环境变量:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN（可选）
 * - SENTRY_AUTH_TOKEN: Sentry Auth Token（用于 source map 上传，可选）
 */

import * as Sentry from "@sentry/nextjs";

// ============================================
// 配置检查
// ============================================

/**
 * 检查 Sentry 是否已配置
 */
export function isSentryEnabled(): boolean {
	return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
}

// ============================================
// Sentry 初始化
// ============================================

/**
 * 初始化 Sentry（服务端）
 *
 * 在 instrumentation.ts 中调用
 */
export function initSentryServer(): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		environment: process.env.NODE_ENV,

		// 性能监控采样率
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

		// 错误采样率
		sampleRate: 1.0,

		// 调试模式（仅开发环境）
		debug: process.env.NODE_ENV === "development",

		// 忽略常见的无害错误
		ignoreErrors: [
			// 网络错误
			"Network request failed",
			"Failed to fetch",
			"NetworkError",
			"AbortError",
			// 用户取消
			"User cancelled",
			"User denied",
			// 常见的第三方脚本错误
			"Script error",
			"Non-Error promise rejection",
		],

		// 过滤敏感数据
		beforeSend(event) {
			// 过滤掉敏感信息
			if (event.request?.headers) {
				delete event.request.headers["authorization"];
				delete event.request.headers["cookie"];
			}
			return event;
		},
	});
}

/**
 * 初始化 Sentry（客户端）
 *
 * 在 sentry.client.config.ts 中调用
 */
export function initSentryClient(): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		environment: process.env.NODE_ENV,

		// 性能监控
		tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

		// Replay 配置（可选）
		replaysSessionSampleRate: 0,
		replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

		// 调试模式
		debug: false,

		// 忽略常见错误
		ignoreErrors: [
			"Network request failed",
			"Failed to fetch",
			"Script error",
			"ResizeObserver loop",
		],
	});
}

// ============================================
// 错误捕获 API
// ============================================

/**
 * 捕获异常
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   captureError(error, { userId: "123", action: "checkout" });
 * }
 * ```
 */
export function captureError(
	error: unknown,
	context?: Record<string, unknown>
): void {
	if (!isSentryEnabled()) {
		// 未配置时打印到 console
		console.error("[Error]", error, context);
		return;
	}

	if (context) {
		Sentry.captureException(error, { extra: context });
	} else {
		Sentry.captureException(error);
	}
}

/**
 * 捕获消息（非错误事件）
 *
 * @example
 * ```ts
 * captureMessage("User attempted invalid action", "warning", { userId: "123" });
 * ```
 */
export function captureMessage(
	message: string,
	level: Sentry.SeverityLevel = "info",
	context?: Record<string, unknown>
): void {
	if (!isSentryEnabled()) {
		const logFn = level === "error" ? console.error : level === "warning" ? console.warn : console.log;
		logFn(`[${level}]`, message, context);
		return;
	}

	if (context) {
		Sentry.captureMessage(message, { level, extra: context });
	} else {
		Sentry.captureMessage(message, level);
	}
}

// ============================================
// 用户上下文
// ============================================

/**
 * 设置用户上下文
 *
 * @example
 * ```ts
 * setUser({ id: "123", email: "user@example.com" });
 * ```
 */
export function setUser(user: {
	id: string;
	email?: string;
	username?: string;
} | null): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.setUser(user);
}

/**
 * 清除用户上下文（登出时调用）
 */
export function clearUser(): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.setUser(null);
}

// ============================================
// 标签和上下文
// ============================================

/**
 * 设置标签
 *
 * @example
 * ```ts
 * setTag("payment_provider", "stripe");
 * ```
 */
export function setTag(key: string, value: string): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.setTag(key, value);
}

/**
 * 设置额外上下文
 *
 * @example
 * ```ts
 * setContext("order", { orderId: "123", amount: 99.99 });
 * ```
 */
export function setContext(name: string, context: Record<string, unknown>): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.setContext(name, context);
}

// ============================================
// 性能追踪
// ============================================

/**
 * 开始一个性能 Span
 *
 * @example
 * ```ts
 * const span = startSpan("database.query", "SELECT * FROM users");
 * await db.query(...);
 * span?.end();
 * ```
 */
export function startSpan(
	operation: string,
	description?: string
): Sentry.Span | undefined {
	if (!isSentryEnabled()) {
		return undefined;
	}

	return Sentry.startInactiveSpan({
		op: operation,
		name: description ?? operation,
	});
}

/**
 * 包装异步操作并追踪性能
 *
 * @example
 * ```ts
 * const result = await withSpan("api.call", "Fetch user data", async () => {
 *   return await fetchUser(userId);
 * });
 * ```
 */
export async function withSpan<T>(
	operation: string,
	description: string,
	fn: () => Promise<T>
): Promise<T> {
	if (!isSentryEnabled()) {
		return fn();
	}

	return Sentry.startSpan(
		{
			op: operation,
			name: description,
		},
		fn
	);
}

// ============================================
// Server Action 包装器
// ============================================

/**
 * 包装 Server Action 以自动捕获错误
 *
 * @example
 * ```ts
 * export const myAction = withSentryAction(async (input: Input) => {
 *   // action logic
 *   return { success: true };
 * });
 * ```
 */
export function withSentryAction<TInput, TOutput>(
	action: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<TOutput> {
	return async (input: TInput) => {
		try {
			return await action(input);
		} catch (error) {
			captureError(error, { action: action.name, input });
			throw error;
		}
	};
}

// ============================================
// API Route 包装器
// ============================================

/**
 * 包装 API Route Handler 以自动捕获错误
 *
 * @example
 * ```ts
 * export const GET = withSentryHandler(async (request) => {
 *   // handler logic
 *   return NextResponse.json({ data });
 * });
 * ```
 */
export function withSentryHandler<T extends Response>(
	handler: (request: Request) => Promise<T>
): (request: Request) => Promise<T | Response> {
	return async (request: Request) => {
		try {
			return await handler(request);
		} catch (error) {
			const url = new URL(request.url);
			captureError(error, {
				method: request.method,
				path: url.pathname,
			});

			// 返回通用错误响应
			return new Response(
				JSON.stringify({
					error: "Internal Server Error",
					message: "服务器内部错误，请稍后重试",
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	};
}

// ============================================
// 重新导出 Sentry 类型
// ============================================

export type { SeverityLevel } from "@sentry/nextjs";
