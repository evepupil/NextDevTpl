/**
 * 积分系统核心业务逻辑集成测试
 *
 * 测试范围：
 * - ensureCreditsBalance: 账户创建
 * - ensureRegistrationBonus: 注册奖励（懒加载）
 * - grantCredits: 发放积分
 * - consumeCredits: 消费积分 (FIFO)
 * - processExpiredBatches: 过期批次处理
 * - freezeCreditsAccount / unfreezeCreditsAccount: 账户冻结
 */

import { afterAll, describe, expect, it } from "vitest";
import {
	cleanupTestUsers,
	createTestCreditsBatch,
	createTestCreditsBalance,
	createTestUser,
	createTestUserWithCredits,
	daysFromNow,
	expiredDate,
	getUserCreditsState,
} from "../utils";

import {
	AccountFrozenError,
	consumeCredits,
	ensureCreditsBalance,
	ensureRegistrationBonus,
	freezeCreditsAccount,
	getCreditsBalance,
	getUserActiveBatches,
	getUserTransactions,
	grantCredits,
	InsufficientCreditsError,
	processExpiredBatches,
	unfreezeCreditsAccount,
} from "@/features/credits/core";
import {
	CREDITS_EXPIRY_DAYS,
	REGISTRATION_BONUS_CREDITS,
} from "@/features/credits/config";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// ensureCreditsBalance 测试
// ============================================

describe("ensureCreditsBalance", () => {
	it("应该为新用户创建积分账户", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		const balance = await ensureCreditsBalance(user.id);

		expect(balance).toBeDefined();
		expect(balance.userId).toBe(user.id);
		expect(balance.balance).toBe(0);
		expect(balance.totalEarned).toBe(0);
		expect(balance.totalSpent).toBe(0);
		expect(balance.status).toBe("active");
	});

	it("应该返回已存在的积分账户", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 第一次调用创建账户
		const balance1 = await ensureCreditsBalance(user.id);
		// 第二次调用应该返回相同账户
		const balance2 = await ensureCreditsBalance(user.id);

		expect(balance1.id).toBe(balance2.id);
		expect(balance1.userId).toBe(balance2.userId);
	});
});

// ============================================
// ensureRegistrationBonus 测试
// ============================================

describe("ensureRegistrationBonus", () => {
	it("应该为新用户发放注册奖励", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		const result = await ensureRegistrationBonus(
			user.id,
			REGISTRATION_BONUS_CREDITS,
			CREDITS_EXPIRY_DAYS
		);

		expect(result.granted).toBe(true);
		if ("amount" in result) {
			expect(result.amount).toBe(REGISTRATION_BONUS_CREDITS);
		}

		// 验证数据库状态
		const state = await getUserCreditsState(user.id);
		expect(state.balance?.balance).toBe(REGISTRATION_BONUS_CREDITS);
		expect(state.batches).toHaveLength(1);
		expect(state.batches[0]!.sourceType).toBe("bonus");
		expect(state.transactions).toHaveLength(1);
		expect(state.transactions[0]!.type).toBe("registration_bonus");
	});

	it("不应该重复发放注册奖励", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 第一次发放
		await ensureRegistrationBonus(
			user.id,
			REGISTRATION_BONUS_CREDITS,
			CREDITS_EXPIRY_DAYS
		);

		// 第二次调用不应该发放
		const result = await ensureRegistrationBonus(
			user.id,
			REGISTRATION_BONUS_CREDITS,
			CREDITS_EXPIRY_DAYS
		);

		expect(result.granted).toBe(false);
		if (!result.granted) {
			expect(result.reason).toBe("User already has transactions");
		}

		// 验证余额没有增加
		const state = await getUserCreditsState(user.id);
		expect(state.balance?.balance).toBe(REGISTRATION_BONUS_CREDITS);
	});
});

// ============================================
// grantCredits 测试
// ============================================

describe("grantCredits", () => {
	it("应该正确发放积分", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		const result = await grantCredits({
			userId: user.id,
			amount: 500,
			sourceType: "purchase",
			debitAccount: "PAYMENT:test_order_123",
			transactionType: "purchase",
			expiresAt: daysFromNow(90),
			sourceRef: "test_order_123",
			description: "测试购买积分",
		});

		expect(result.amount).toBe(500);
		expect(result.batchId).toBeDefined();
		expect(result.transactionId).toBeDefined();
		expect(result.newBalance).toBe(500);

		// 验证数据库状态
		const state = await getUserCreditsState(user.id);
		expect(state.balance?.balance).toBe(500);
		expect(state.balance?.totalEarned).toBe(500);
	});

	it("应该拒绝金额为 0 或负数", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		await expect(
			grantCredits({
				userId: user.id,
				amount: 0,
				sourceType: "bonus",
				debitAccount: "SYSTEM:test",
				transactionType: "registration_bonus",
			})
		).rejects.toThrow("积分数量必须大于 0");

		await expect(
			grantCredits({
				userId: user.id,
				amount: -10,
				sourceType: "bonus",
				debitAccount: "SYSTEM:test",
				transactionType: "registration_bonus",
			})
		).rejects.toThrow("积分数量必须大于 0");
	});

	it("应该拒绝向冻结账户发放积分", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建账户并冻结
		await ensureCreditsBalance(user.id);
		await freezeCreditsAccount(user.id);

		await expect(
			grantCredits({
				userId: user.id,
				amount: 100,
				sourceType: "bonus",
				debitAccount: "SYSTEM:test",
				transactionType: "registration_bonus",
			})
		).rejects.toThrow(AccountFrozenError);
	});
});

// ============================================
// consumeCredits 测试
// ============================================

describe("consumeCredits", () => {
	it("应该正确消费积分", async () => {
		const { user } = await createTestUserWithCredits({
			initialCredits: 200,
		});
		createdUserIds.push(user.id);

		const result = await consumeCredits({
			userId: user.id,
			amount: 50,
			serviceName: "ai-chat",
			description: "AI 对话消费",
		});

		expect(result.success).toBe(true);
		expect(result.consumedAmount).toBe(50);
		expect(result.remainingBalance).toBe(150);
		expect(result.transactionId).toBeDefined();
		expect(result.consumedBatches.length).toBeGreaterThan(0);
	});

	it("应该按 FIFO 顺序消费（先过期的先消费）", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建账户
		await createTestCreditsBalance({
			userId: user.id,
			balance: 300,
			totalEarned: 300,
		});

		// 创建多个批次，不同过期时间
		const batch1 = await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			expiresAt: daysFromNow(10), // 最早过期
		});

		const batch2 = await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			expiresAt: daysFromNow(30), // 较晚过期
		});

		// batch3 用于确保有足够余额，虽然不会被消费到
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			expiresAt: daysFromNow(60), // 最晚过期
		});

		// 消费 150，应该先从 batch1 消费 100，再从 batch2 消费 50
		const result = await consumeCredits({
			userId: user.id,
			amount: 150,
			serviceName: "test-service",
		});

		expect(result.success).toBe(true);
		expect(result.consumedBatches).toHaveLength(2);
		expect(result.consumedBatches[0]!.batchId).toBe(batch1.id);
		expect(result.consumedBatches[0]!.consumedFromBatch).toBe(100);
		expect(result.consumedBatches[1]!.batchId).toBe(batch2.id);
		expect(result.consumedBatches[1]!.consumedFromBatch).toBe(50);
	});

	it("应该在余额不足时抛出错误", async () => {
		const { user } = await createTestUserWithCredits({
			initialCredits: 50,
		});
		createdUserIds.push(user.id);

		await expect(
			consumeCredits({
				userId: user.id,
				amount: 100,
				serviceName: "test-service",
			})
		).rejects.toThrow(InsufficientCreditsError);

		try {
			await consumeCredits({
				userId: user.id,
				amount: 100,
				serviceName: "test-service",
			});
		} catch (error) {
			expect(error).toBeInstanceOf(InsufficientCreditsError);
			if (error instanceof InsufficientCreditsError) {
				expect(error.required).toBe(100);
				expect(error.available).toBe(50);
			}
		}
	});

	it("应该拒绝从冻结账户消费", async () => {
		const { user } = await createTestUserWithCredits({
			initialCredits: 100,
		});
		createdUserIds.push(user.id);

		await freezeCreditsAccount(user.id);

		await expect(
			consumeCredits({
				userId: user.id,
				amount: 10,
				serviceName: "test-service",
			})
		).rejects.toThrow(AccountFrozenError);
	});

	it("应该拒绝金额为 0 或负数", async () => {
		const { user } = await createTestUserWithCredits({
			initialCredits: 100,
		});
		createdUserIds.push(user.id);

		await expect(
			consumeCredits({
				userId: user.id,
				amount: 0,
				serviceName: "test-service",
			})
		).rejects.toThrow("消费数量必须大于 0");
	});
});

// ============================================
// processExpiredBatches 测试
// ============================================

describe("processExpiredBatches", () => {
	it("应该处理过期的批次", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建账户
		await createTestCreditsBalance({
			userId: user.id,
			balance: 100,
			totalEarned: 100,
		});

		// 创建已过期的批次
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			remaining: 100,
			expiresAt: expiredDate(),
			status: "active",
		});

		// 处理过期批次
		const results = await processExpiredBatches();

		// 应该有一个过期处理结果
		const userResult = results.find((r) => r.userId === user.id);
		expect(userResult).toBeDefined();
		expect(userResult?.expiredAmount).toBe(100);

		// 验证余额已扣除
		const state = await getUserCreditsState(user.id);
		expect(state.balance?.balance).toBe(0);

		// 验证批次状态
		const expiredBatch = state.batches.find((b) => b.status === "expired");
		expect(expiredBatch).toBeDefined();

		// 验证交易记录
		const expirationTx = state.transactions.find(
			(t) => t.type === "expiration"
		);
		expect(expirationTx).toBeDefined();
	});

	it("不应该处理未过期的批次", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建账户
		await createTestCreditsBalance({
			userId: user.id,
			balance: 100,
			totalEarned: 100,
		});

		// 创建未过期的批次
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			expiresAt: daysFromNow(30),
		});

		// 处理过期批次
		const results = await processExpiredBatches();

		// 不应该有该用户的处理结果
		const userResult = results.find((r) => r.userId === user.id);
		expect(userResult).toBeUndefined();

		// 验证余额未变
		const state = await getUserCreditsState(user.id);
		expect(state.balance?.balance).toBe(100);
	});
});

// ============================================
// 账户冻结/解冻测试
// ============================================

describe("freezeCreditsAccount / unfreezeCreditsAccount", () => {
	it("应该正确冻结账户", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		await ensureCreditsBalance(user.id);
		await freezeCreditsAccount(user.id);

		const balance = await getCreditsBalance(user.id);
		expect(balance.status).toBe("frozen");
	});

	it("应该正确解冻账户", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		await ensureCreditsBalance(user.id);
		await freezeCreditsAccount(user.id);
		await unfreezeCreditsAccount(user.id);

		const balance = await getCreditsBalance(user.id);
		expect(balance.status).toBe("active");
	});
});

// ============================================
// 查询函数测试
// ============================================

describe("getUserActiveBatches", () => {
	it("应该返回用户的活跃批次", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建多个批次
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			expiresAt: daysFromNow(30),
		});
		await createTestCreditsBatch({
			userId: user.id,
			amount: 200,
			expiresAt: daysFromNow(60),
		});

		const batches = await getUserActiveBatches(user.id);

		expect(batches).toHaveLength(2);
		// 应该按过期时间排序
		expect(batches[0]!.amount).toBe(100);
		expect(batches[1]!.amount).toBe(200);
	});

	it("不应该返回已过期或已消费的批次", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建活跃批次
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			status: "active",
		});

		// 创建已消费批次
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			status: "consumed",
		});

		// 创建已过期批次
		await createTestCreditsBatch({
			userId: user.id,
			amount: 100,
			status: "expired",
		});

		const batches = await getUserActiveBatches(user.id);

		expect(batches).toHaveLength(1);
		expect(batches[0]!.status).toBe("active");
	});
});

describe("getUserTransactions", () => {
	it("应该返回用户的交易历史", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建一些交易
		await grantCredits({
			userId: user.id,
			amount: 100,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
		});

		const transactions = await getUserTransactions(user.id);

		expect(transactions.length).toBeGreaterThan(0);
		expect(transactions[0]!.userId).toBe(user.id);
	});

	it("应该支持分页", async () => {
		const user = await createTestUser();
		createdUserIds.push(user.id);

		// 创建多个交易
		for (let i = 0; i < 5; i++) {
			await grantCredits({
				userId: user.id,
				amount: 10,
				sourceType: "bonus",
				debitAccount: "SYSTEM:test",
				transactionType: "registration_bonus",
			});
		}

		const page1 = await getUserTransactions(user.id, { limit: 2 });
		const page2 = await getUserTransactions(user.id, { limit: 2, offset: 2 });

		expect(page1).toHaveLength(2);
		expect(page2).toHaveLength(2);
		expect(page1[0]!.id).not.toBe(page2[0]!.id);
	});
});
