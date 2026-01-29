import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/index";
import { logError, logger } from "@/lib/logger";
import { captureError } from "@/lib/monitoring";

/**
 * 基础 Action 客户端
 *
 * 用于创建不需要认证的 Server Actions
 * 自动集成日志和错误监控（开箱即用）
 */
export const actionClient = createSafeActionClient({
	/**
	 * 处理服务器错误
	 * - 自动记录结构化日志
	 * - 自动上报 Sentry（如已配置）
	 * - 生产环境下隐藏具体错误信息
	 */
	handleServerError(error) {
		// 结构化日志记录
		logError(error, { source: "server-action" });

		// Sentry 上报（未配置时自动跳过）
		captureError(error, { source: "server-action" });

		// 生产环境返回通用错误信息
		if (process.env.NODE_ENV === "production") {
			return "服务器错误，请稍后重试";
		}

		return error.message;
	},
});

/**
 * 受保护的 Action 客户端
 *
 * 用于创建需要用户认证的 Server Actions
 * 通过中间件验证用户会话，并将用户信息传递给 action
 */
export const protectedAction = actionClient.use(async ({ next }) => {
	/**
	 * 获取当前用户会话
	 * 使用 Better Auth 的 getSession 方法
	 */
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// 如果没有会话或用户信息，抛出认证错误
	if (!session || !session.user) {
		throw new Error("请先登录后再执行此操作");
	}

	// 设置用户上下文到日志
	logger.debug(
		{ userId: session.user.id },
		"Authenticated action executed"
	);

	/**
	 * 将用户信息传递给下游 action
	 * ctx 对象可以在 action 中通过 ctx 参数访问
	 */
	return next({
		ctx: {
			userId: session.user.id,
			user: session.user,
		},
	});
});

/**
 * 管理员 Action 客户端
 *
 * 用于创建需要管理员权限的 Server Actions
 * 在 protectedAction 基础上增加角色验证
 */
export const adminAction = protectedAction.use(async ({ next, ctx }) => {
	// 检查用户是否为管理员
	// 类型断言: role 字段在 Better Auth additionalFields 中定义
	const userWithRole = ctx.user as { role?: string };
	if (userWithRole.role !== "admin") {
		throw new Error("此操作需要管理员权限");
	}

	return next({
		ctx: {
			...ctx,
			isAdmin: true,
		},
	});
});
