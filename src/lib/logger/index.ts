/**
 * 日志模块
 *
 * 使用 Pino 实现结构化日志
 * 支持 Axiom 云日志服务（可选）
 * 未配置时回退到 console 输出
 *
 * 环境变量:
 * - AXIOM_TOKEN: Axiom API Token（可选）
 * - AXIOM_DATASET: Axiom 数据集名称（可选，默认 "nextdevtpl"）
 */

import pino from "pino";

// ============================================
// 配置检查
// ============================================

/**
 * 检查 Axiom 是否已配置
 */
export function isAxiomEnabled(): boolean {
	return !!process.env.AXIOM_TOKEN;
}

/**
 * 检查是否为生产环境
 */
function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

// ============================================
// Logger 创建
// ============================================

/**
 * 创建 Logger 实例
 *
 * 日志级别:
 * - production: info 及以上
 * - development: debug 及以上
 *
 * 输出目标:
 * - 配置了 Axiom: 发送到 Axiom + console
 * - 未配置 Axiom: 仅 console（开发环境美化输出）
 */
function createLogger(): pino.Logger {
	const level = isProduction() ? "info" : "debug";

	// 基础配置
	const baseOptions: pino.LoggerOptions = {
		level,
		base: {
			env: process.env.NODE_ENV,
			service: "nextdevtpl",
		},
		timestamp: pino.stdTimeFunctions.isoTime,
	};

	// 开发环境使用美化输出
	if (!isProduction()) {
		return pino({
			...baseOptions,
			transport: {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			},
		});
	}

	// 生产环境：结构化 JSON 输出
	// Axiom 集成通过 Vercel Log Drain 或其他方式处理
	return pino(baseOptions);
}

// ============================================
// Logger 实例（单例）
// ============================================

/**
 * 全局 Logger 实例
 */
export const logger = createLogger();

// ============================================
// 便捷方法
// ============================================

/**
 * 创建带上下文的子 Logger
 *
 * @example
 * ```ts
 * const log = createContextLogger({ userId: "123", requestId: "abc" });
 * log.info("User action");
 * ```
 */
export function createContextLogger(
	context: Record<string, unknown>
): pino.Logger {
	return logger.child(context);
}

/**
 * 创建请求级别的 Logger
 *
 * @example
 * ```ts
 * const log = createRequestLogger(request);
 * log.info("Processing request");
 * ```
 */
export function createRequestLogger(request: Request): pino.Logger {
	const url = new URL(request.url);

	return logger.child({
		requestId: crypto.randomUUID(),
		method: request.method,
		path: url.pathname,
		userAgent: request.headers.get("user-agent")?.slice(0, 100),
	});
}

// ============================================
// 类型化日志辅助
// ============================================

/**
 * 业务事件类型
 */
export type BusinessEvent =
	| "user.signup"
	| "user.login"
	| "user.logout"
	| "payment.checkout.started"
	| "payment.checkout.completed"
	| "payment.subscription.created"
	| "payment.subscription.canceled"
	| "credits.purchased"
	| "credits.consumed"
	| "credits.expired"
	| "ticket.created"
	| "ticket.replied"
	| "ticket.closed"
	| "email.sent"
	| "file.uploaded"
	| "file.deleted"
	| "admin.user.banned"
	| "admin.user.unbanned";

/**
 * 记录业务事件
 *
 * @example
 * ```ts
 * logEvent("user.signup", { userId: "123", provider: "github" });
 * logEvent("payment.checkout.completed", { userId: "123", amount: 9.99 });
 * ```
 */
export function logEvent(
	event: BusinessEvent,
	data?: Record<string, unknown>
): void {
	logger.info({ event, ...data }, `Event: ${event}`);
}

/**
 * 记录错误（带堆栈）
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logError(error, { context: "payment processing" });
 * }
 * ```
 */
export function logError(
	error: unknown,
	context?: Record<string, unknown>
): void {
	if (error instanceof Error) {
		logger.error(
			{
				err: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
				...context,
			},
			error.message
		);
	} else {
		logger.error({ err: error, ...context }, "Unknown error");
	}
}

/**
 * 记录警告
 */
export function logWarn(
	message: string,
	data?: Record<string, unknown>
): void {
	logger.warn(data, message);
}

/**
 * 记录调试信息（仅开发环境）
 */
export function logDebug(
	message: string,
	data?: Record<string, unknown>
): void {
	logger.debug(data, message);
}

// ============================================
// API 响应日志
// ============================================

/**
 * 记录 API 响应
 */
export function logApiResponse(
	request: Request,
	response: Response,
	duration: number
): void {
	const url = new URL(request.url);
	const level = response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info";

	logger[level](
		{
			method: request.method,
			path: url.pathname,
			status: response.status,
			duration,
		},
		`${request.method} ${url.pathname} ${response.status} ${duration}ms`
	);
}

// ============================================
// 导出类型
// ============================================

export type { Logger } from "pino";
