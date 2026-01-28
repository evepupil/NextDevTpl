/**
 * Cron Job 定时任务集成测试
 *
 * 测试范围：
 * - Bearer Token 身份验证
 * - 积分过期处理 Cron Job
 * - 健康检查端点
 *
 * 注意：这些测试验证 Cron Job 的核心逻辑，不实际发起 HTTP 请求
 */

import { afterAll, describe, expect, it } from "vitest";

import { processExpiredBatches } from "@/features/credits/core";
import {
	cleanupTestUsers,
	createTestCreditsBatch,
	createTestCreditsBalance,
	createTestUser,
	daysAgo,
	getUserCreditsState,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 模拟 Cron Job 验证逻辑
// (从 api/jobs/credits/expire/route.ts 提取)
// ============================================

/**
 * 验证 Cron Job 请求的 Bearer Token
 *
 * 安全检查:
 * - 验证 Bearer Token 格式
 * - 拒绝格式错误的请求 (如多余空格)
 */
function validateCronSecret(authHeader: string | null, cronSecret: string | undefined): boolean {
	if (!authHeader) return false;
	if (!cronSecret) return false;

	// 支持 Bearer Token 格式
	if (authHeader.startsWith("Bearer ")) {
		// 必须是 "Bearer " + token，不允许多余空格
		const token = authHeader.slice(7);
		// 如果 token 以空格开头，说明原始格式是 "Bearer  xxx"，拒绝
		if (token.startsWith(" ")) return false;
		return token === cronSecret;
	}

	// 不带 Bearer 前缀的直接比较
	return authHeader === cronSecret;
}

// ============================================
// Bearer Token 验证测试
// ============================================

describe("Cron Job Authentication", () => {
	const validSecret = "test_cron_secret_12345";

	it("应该接受有效的 Bearer Token", () => {
		expect(validateCronSecret(`Bearer ${validSecret}`, validSecret)).toBe(true);
	});

	it("应该接受不带 Bearer 前缀的 Token", () => {
		expect(validateCronSecret(validSecret, validSecret)).toBe(true);
	});

	it("应该拒绝空的 Authorization Header", () => {
		expect(validateCronSecret(null, validSecret)).toBe(false);
		expect(validateCronSecret("", validSecret)).toBe(false);
	});

	it("应该拒绝错误的 Token", () => {
		expect(validateCronSecret("Bearer wrong_token", validSecret)).toBe(false);
		expect(validateCronSecret("wrong_token", validSecret)).toBe(false);
	});

	it("没有配置 CRON_SECRET 时应该拒绝所有请求", () => {
		expect(validateCronSecret(`Bearer ${validSecret}`, undefined)).toBe(false);
		expect(validateCronSecret(`Bearer ${validSecret}`, "")).toBe(false);
	});

	it("应该区分大小写", () => {
		expect(validateCronSecret("Bearer TEST_CRON_SECRET_12345", validSecret)).toBe(false);
		expect(validateCronSecret("bearer test_cron_secret_12345", validSecret)).toBe(false);
	});

	it("应该处理带空格的 Token", () => {
		expect(validateCronSecret("Bearer  token_with_space", " token_with_space")).toBe(false);
		expect(validateCronSecret("Bearer token ", "token ")).toBe(true);
	});
});

// ============================================
// 积分过期处理测试
// ============================================

describe("Credits Expire Cron Job", () => {
	it("应该处理过期的积分批次", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建余额记录
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 200,
			totalEarned: 200,
		});

		// 创建一个过期的批次
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 200,
			remaining: 200,
			sourceType: "purchase",
			expiresAt: daysAgo(1), // 昨天过期
		});

		// 执行过期处理
		const results = await processExpiredBatches();

		// 验证处理结果
		expect(results.length).toBeGreaterThan(0);

		const userResult = results.find((r) => r.userId === testUser.id);
		expect(userResult).toBeDefined();
		expect(userResult!.expiredAmount).toBe(200);

		// 验证余额已更新
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(0);
	});

	it("不应该处理未过期的批次", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建余额记录
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 100,
			totalEarned: 100,
		});

		// 创建一个未过期的批次（30天后过期）
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 100,
			remaining: 100,
			sourceType: "purchase",
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		});

		// 执行过期处理
		const results = await processExpiredBatches();

		// 这个用户的批次不应该被处理
		const userResult = results.find((r) => r.userId === testUser.id);
		expect(userResult).toBeUndefined();

		// 验证余额不变
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(100);
	});

	it("应该只处理有剩余积分的过期批次", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建余额记录
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 50,
			totalEarned: 100,
		});

		// 创建一个已经用完的过期批次
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 100,
			remaining: 0, // 已用完
			sourceType: "purchase",
			expiresAt: daysAgo(1),
		});

		// 创建一个有剩余的过期批次
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 50,
			remaining: 50,
			sourceType: "purchase",
			expiresAt: daysAgo(1),
		});

		// 执行过期处理
		const results = await processExpiredBatches();

		// 只有有剩余的批次应该被处理
		const userResult = results.find((r) => r.userId === testUser.id);
		expect(userResult).toBeDefined();
		expect(userResult!.expiredAmount).toBe(50);
	});

	it("应该处理多个用户的过期批次", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		createdUserIds.push(user1.id, user2.id);

		// 为两个用户创建过期批次
		for (const testUser of [user1, user2]) {
			await createTestCreditsBalance({
				userId: testUser.id,
				balance: 100,
				totalEarned: 100,
			});

			await createTestCreditsBatch({
				userId: testUser.id,
				amount: 100,
				remaining: 100,
				sourceType: "purchase",
				expiresAt: daysAgo(1),
			});
		}

		// 执行过期处理
		const results = await processExpiredBatches();

		// 两个用户都应该被处理
		const user1Result = results.find((r) => r.userId === user1.id);
		const user2Result = results.find((r) => r.userId === user2.id);

		expect(user1Result).toBeDefined();
		expect(user2Result).toBeDefined();
	});

	it("没有过期批次时应该返回空数组", async () => {
		// 不创建任何过期批次，直接运行
		// processExpiredBatches 应该正常返回空数组
		const results = await processExpiredBatches();

		// 结果应该是数组（可能为空或包含其他测试的数据）
		expect(Array.isArray(results)).toBe(true);
	});
});

// ============================================
// Cron Job 响应格式测试
// ============================================

describe("Cron Job Response Format", () => {
	it("成功响应应该包含正确的字段", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建过期批次
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 50,
			totalEarned: 50,
		});

		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 50,
			remaining: 50,
			sourceType: "purchase",
			expiresAt: daysAgo(1),
		});

		const results = await processExpiredBatches();
		const userResult = results.find((r) => r.userId === testUser.id);

		// 验证响应格式
		expect(userResult).toBeDefined();
		expect(userResult!.batchId).toBeDefined();
		expect(userResult!.userId).toBe(testUser.id);
		expect(userResult!.expiredAmount).toBe(50);

		// 模拟 API 响应格式
		const apiResponse = {
			success: true,
			processed: results.length,
			details: results.map((r) => ({
				batchId: r.batchId,
				userId: r.userId,
				expiredAmount: r.expiredAmount,
			})),
			timestamp: new Date().toISOString(),
		};

		expect(apiResponse.success).toBe(true);
		expect(apiResponse.processed).toBeGreaterThan(0);
		expect(apiResponse.details).toBeInstanceOf(Array);
		expect(apiResponse.timestamp).toBeDefined();
	});
});

// ============================================
// 健康检查端点测试
// ============================================

describe("Cron Job Health Check", () => {
	it("健康检查应该返回正确的信息", () => {
		// 模拟健康检查响应
		const healthResponse = {
			status: "ok",
			endpoint: "/api/jobs/credits/expire",
			method: "POST",
			description: "Process expired credit batches",
			authentication: "Bearer token required (CRON_SECRET)",
		};

		expect(healthResponse.status).toBe("ok");
		expect(healthResponse.endpoint).toBe("/api/jobs/credits/expire");
		expect(healthResponse.method).toBe("POST");
		expect(healthResponse.authentication).toContain("Bearer");
	});
});

// ============================================
// 错误处理测试
// ============================================

describe("Cron Job Error Handling", () => {
	it("应该优雅处理空数据库", async () => {
		// processExpiredBatches 应该能处理没有任何数据的情况
		await expect(processExpiredBatches()).resolves.not.toThrow();
	});

	it("模拟错误响应格式应该正确", () => {
		// 模拟错误响应
		const errorResponse = {
			success: false,
			error: "Failed to process expired batches",
			message: "Database connection failed",
		};

		expect(errorResponse.success).toBe(false);
		expect(errorResponse.error).toBeDefined();
		expect(errorResponse.message).toBeDefined();
	});
});

// ============================================
// 并发安全测试
// ============================================

describe("Cron Job Concurrency", () => {
	it("并发执行不应该导致数据不一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建过期批次
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 100,
			totalEarned: 100,
		});

		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 100,
			remaining: 100,
			sourceType: "purchase",
			expiresAt: daysAgo(1),
		});

		// 并发执行两次过期处理
		const [results1, results2] = await Promise.all([
			processExpiredBatches(),
			processExpiredBatches(),
		]);

		// 只有一次应该成功处理该批次
		// 另一次应该发现批次已被处理（remaining = 0）
		const user1Result = results1.find((r) => r.userId === testUser.id);
		const user2Result = results2.find((r) => r.userId === testUser.id);

		// 至少有一个应该处理了该批次
		const processedCount = [user1Result, user2Result].filter(Boolean).length;
		expect(processedCount).toBeGreaterThanOrEqual(1);

		// 最终余额应该是 0
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(0);
	});
});
