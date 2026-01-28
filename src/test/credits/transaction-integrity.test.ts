/**
 * 事务完整性集成测试
 *
 * 测试范围：
 * - grantCredits 事务原子性（批次 + 交易记录 + 余额 一致）
 * - consumeCredits 事务原子性（FIFO 扣减 + 交易记录 + 余额 一致）
 * - consumeCredits 失败回滚（余额不足 / 账户冻结 → 无脏数据）
 * - grantCredits 失败回滚（账户冻结 → 无批次或交易残留）
 * - processExpiredBatches 事务原子性（过期标记 + 余额扣减 + 交易记录 一致）
 * - 连续操作后数据一致性
 */

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { creditsBatch, creditsBalance } from "@/db/schema";
import {
	grantCredits,
	consumeCredits,
	processExpiredBatches,
} from "@/features/credits/core";
import {
	cleanupTestUsers,
	createTestCreditsBalance,
	createTestCreditsBatch,
	createTestUser,
	getUserCreditsState,
	expiredDate,
	daysFromNow,
	testDb,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// grantCredits 事务原子性
// ============================================

describe("grantCredits Transaction Atomicity", () => {
	it("发放积分后，批次、交易记录、余额应全部一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const result = await grantCredits({
			userId: testUser.id,
			amount: 200,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `txn_test_${Date.now()}`,
		});

		// 验证返回值
		expect(result.amount).toBe(200);
		expect(result.newBalance).toBe(200);
		expect(result.batchId).toBeDefined();
		expect(result.transactionId).toBeDefined();

		// 验证数据库状态 — 三张表一致
		const state = await getUserCreditsState(testUser.id);

		// 余额
		expect(state.balance).toBeDefined();
		expect(state.balance!.balance).toBe(200);
		expect(state.balance!.totalEarned).toBe(200);
		expect(state.balance!.totalSpent).toBe(0);

		// 批次
		expect(state.batches).toHaveLength(1);
		expect(state.batches[0]!.amount).toBe(200);
		expect(state.batches[0]!.remaining).toBe(200);
		expect(state.batches[0]!.status).toBe("active");

		// 交易记录
		expect(state.transactions).toHaveLength(1);
		expect(state.transactions[0]!.amount).toBe(200);
		expect(state.transactions[0]!.type).toBe("registration_bonus");
	});

	it("多次发放后余额应等于各批次之和", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `txn_a_${Date.now()}`,
		});

		await grantCredits({
			userId: testUser.id,
			amount: 250,
			sourceType: "purchase",
			debitAccount: "STRIPE:test",
			transactionType: "purchase",
			sourceRef: `txn_b_${Date.now()}`,
		});

		await grantCredits({
			userId: testUser.id,
			amount: 50,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "monthly_grant",
			sourceRef: `txn_c_${Date.now()}`,
		});

		const state = await getUserCreditsState(testUser.id);

		// 余额 = 100 + 250 + 50
		expect(state.balance!.balance).toBe(400);
		expect(state.balance!.totalEarned).toBe(400);

		// 批次数
		expect(state.batches).toHaveLength(3);

		// 批次 remaining 总和 = 余额
		const totalRemaining = state.batches.reduce((sum, b) => sum + b.remaining, 0);
		expect(totalRemaining).toBe(400);

		// 交易记录数
		expect(state.transactions).toHaveLength(3);
	});
});

// ============================================
// grantCredits 失败回滚
// ============================================

describe("grantCredits Failure Rollback", () => {
	it("冻结账户发放积分失败后不应产生任何新数据", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建冻结的积分账户
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 100,
			totalEarned: 100,
			status: "frozen",
		});

		// 记录发放前的状态
		const stateBefore = await getUserCreditsState(testUser.id);
		const batchCountBefore = stateBefore.batches.length;
		const txCountBefore = stateBefore.transactions.length;

		// 发放应该失败
		await expect(
			grantCredits({
				userId: testUser.id,
				amount: 50,
				sourceType: "bonus",
				debitAccount: "SYSTEM:test",
				transactionType: "registration_bonus",
				sourceRef: `txn_fail_${Date.now()}`,
			})
		).rejects.toThrow();

		// 验证没有残留数据
		const stateAfter = await getUserCreditsState(testUser.id);
		expect(stateAfter.balance!.balance).toBe(100); // 余额未变
		expect(stateAfter.batches.length).toBe(batchCountBefore); // 无新批次
		expect(stateAfter.transactions.length).toBe(txCountBefore); // 无新交易
	});

	it("发放金额为 0 应该失败且不产生数据", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await expect(
			grantCredits({
				userId: testUser.id,
				amount: 0,
				sourceType: "bonus",
				debitAccount: "SYSTEM:test",
				transactionType: "registration_bonus",
			})
		).rejects.toThrow("积分数量必须大于 0");

		// 不应该创建任何账户
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance).toBeUndefined();
		expect(state.batches).toHaveLength(0);
		expect(state.transactions).toHaveLength(0);
	});
});

// ============================================
// consumeCredits 事务原子性
// ============================================

describe("consumeCredits Transaction Atomicity", () => {
	it("消费后余额、批次剩余、交易记录应一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先发放 300 积分
		await grantCredits({
			userId: testUser.id,
			amount: 300,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `txn_grant_${Date.now()}`,
		});

		// 消费 120 积分
		const result = await consumeCredits({
			userId: testUser.id,
			amount: 120,
			serviceName: "test_service",
			description: "事务测试消费",
		});

		expect(result.success).toBe(true);
		expect(result.consumedAmount).toBe(120);
		expect(result.remainingBalance).toBe(180);

		// 验证数据库一致性
		const state = await getUserCreditsState(testUser.id);

		// 余额
		expect(state.balance!.balance).toBe(180);
		expect(state.balance!.totalSpent).toBe(120);

		// 批次剩余
		expect(state.batches[0]!.remaining).toBe(180);

		// 交易记录：1 笔发放 + 1 笔消费
		expect(state.transactions).toHaveLength(2);
		const consumeTx = state.transactions.find((t) => t.type === "consumption");
		expect(consumeTx).toBeDefined();
		expect(consumeTx!.amount).toBe(120);
	});

	it("FIFO 消费应正确扣减多个批次", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 发放两笔积分
		const grant1 = await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			expiresAt: daysFromNow(10), // 先到期
			sourceRef: `txn_fifo1_${Date.now()}`,
		});

		const grant2 = await grantCredits({
			userId: testUser.id,
			amount: 200,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			expiresAt: daysFromNow(30), // 后到期
			sourceRef: `txn_fifo2_${Date.now()}`,
		});

		// 消费 150（应先扣第一批 100，再扣第二批 50）
		const result = await consumeCredits({
			userId: testUser.id,
			amount: 150,
			serviceName: "test_service",
		});

		expect(result.remainingBalance).toBe(150); // 300 - 150
		expect(result.consumedBatches).toHaveLength(2);

		// 验证批次剩余
		const [batch1] = await testDb
			.select()
			.from(creditsBatch)
			.where(eq(creditsBatch.id, grant1.batchId))
			.limit(1);

		const [batch2] = await testDb
			.select()
			.from(creditsBatch)
			.where(eq(creditsBatch.id, grant2.batchId))
			.limit(1);

		expect(batch1!.remaining).toBe(0); // 第一批完全消费
		expect(batch1!.status).toBe("consumed");
		expect(batch2!.remaining).toBe(150); // 第二批剩余 150
		expect(batch2!.status).toBe("active");

		// 余额一致性：余额 = 所有活跃批次 remaining 之和
		const state = await getUserCreditsState(testUser.id);
		const totalRemaining = state.batches
			.filter((b) => b.status === "active")
			.reduce((sum, b) => sum + b.remaining, 0);
		expect(state.balance!.balance).toBe(totalRemaining);
	});
});

// ============================================
// consumeCredits 失败回滚
// ============================================

describe("consumeCredits Failure Rollback", () => {
	it("余额不足时消费失败不应产生任何变更", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 发放 50 积分
		await grantCredits({
			userId: testUser.id,
			amount: 50,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `txn_insuf_${Date.now()}`,
		});

		const stateBefore = await getUserCreditsState(testUser.id);

		// 尝试消费 100（超过余额）
		await expect(
			consumeCredits({
				userId: testUser.id,
				amount: 100,
				serviceName: "test_service",
			})
		).rejects.toThrow();

		// 验证数据完全未变
		const stateAfter = await getUserCreditsState(testUser.id);
		expect(stateAfter.balance!.balance).toBe(stateBefore.balance!.balance);
		expect(stateAfter.balance!.totalSpent).toBe(stateBefore.balance!.totalSpent);
		expect(stateAfter.batches[0]!.remaining).toBe(stateBefore.batches[0]!.remaining);
		expect(stateAfter.transactions.length).toBe(stateBefore.transactions.length);
	});

	it("冻结账户消费失败不应产生任何变更", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先发放积分（账户自动创建为 active）
		await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `txn_freeze_${Date.now()}`,
		});

		// 冻结账户
		await testDb
			.update(creditsBalance)
			.set({ status: "frozen" })
			.where(eq(creditsBalance.userId, testUser.id));

		const stateBefore = await getUserCreditsState(testUser.id);

		// 尝试消费
		await expect(
			consumeCredits({
				userId: testUser.id,
				amount: 50,
				serviceName: "test_service",
			})
		).rejects.toThrow();

		// 验证数据完全未变
		const stateAfter = await getUserCreditsState(testUser.id);
		expect(stateAfter.balance!.balance).toBe(stateBefore.balance!.balance);
		expect(stateAfter.batches[0]!.remaining).toBe(stateBefore.batches[0]!.remaining);
		expect(stateAfter.transactions.length).toBe(stateBefore.transactions.length);
	});

	it("无积分账户时消费失败不应创建任何数据", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await expect(
			consumeCredits({
				userId: testUser.id,
				amount: 10,
				serviceName: "test_service",
			})
		).rejects.toThrow();

		const state = await getUserCreditsState(testUser.id);
		expect(state.balance).toBeUndefined();
		expect(state.batches).toHaveLength(0);
		expect(state.transactions).toHaveLength(0);
	});
});

// ============================================
// processExpiredBatches 事务原子性
// ============================================

describe("processExpiredBatches Transaction Atomicity", () => {
	it("过期处理后批次状态、余额、交易记录应一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建积分账户
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 150,
			totalEarned: 150,
		});

		// 创建一个已过期的批次（剩余 80）
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 80,
			remaining: 80,
			status: "active",
			expiresAt: expiredDate(),
		});

		// 创建一个未过期的批次（剩余 70）
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 70,
			remaining: 70,
			status: "active",
			expiresAt: daysFromNow(30),
		});

		// 处理过期
		const results = await processExpiredBatches();

		// 至少处理了我们的过期批次
		const ourResult = results.find((r) => r.userId === testUser.id);
		expect(ourResult).toBeDefined();
		expect(ourResult!.expiredAmount).toBe(80);

		// 验证数据库一致性
		const state = await getUserCreditsState(testUser.id);

		// 余额应减少过期数额：150 - 80 = 70
		expect(state.balance!.balance).toBe(70);

		// 批次状态
		const expiredBatch = state.batches.find((b) => b.status === "expired");
		const activeBatch = state.batches.find((b) => b.status === "active");
		expect(expiredBatch).toBeDefined();
		expect(expiredBatch!.remaining).toBe(80); // 过期时的剩余
		expect(activeBatch).toBeDefined();
		expect(activeBatch!.remaining).toBe(70);

		// 过期交易记录
		const expirationTx = state.transactions.find((t) => t.type === "expiration");
		expect(expirationTx).toBeDefined();
		expect(expirationTx!.amount).toBe(80);

		// 余额 = 所有活跃批次 remaining 之和
		const totalActiveRemaining = state.batches
			.filter((b) => b.status === "active")
			.reduce((sum, b) => sum + b.remaining, 0);
		expect(state.balance!.balance).toBe(totalActiveRemaining);
	});

	it("未过期批次不应被处理", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 100,
			totalEarned: 100,
		});

		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 100,
			remaining: 100,
			status: "active",
			expiresAt: daysFromNow(60),
		});

		await processExpiredBatches();

		// 余额不变
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(100);
		expect(state.batches[0]!.status).toBe("active");
	});
});

// ============================================
// 连续操作一致性
// ============================================

describe("Sequential Operations Consistency", () => {
	it("发放 → 消费 → 发放 → 消费 后数据应完全一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 1. 发放 500
		await grantCredits({
			userId: testUser.id,
			amount: 500,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `seq_1_${Date.now()}`,
		});

		// 2. 消费 200
		await consumeCredits({
			userId: testUser.id,
			amount: 200,
			serviceName: "service_a",
		});

		// 3. 发放 100
		await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "purchase",
			debitAccount: "STRIPE:test",
			transactionType: "purchase",
			sourceRef: `seq_2_${Date.now()}`,
		});

		// 4. 消费 150
		await consumeCredits({
			userId: testUser.id,
			amount: 150,
			serviceName: "service_b",
		});

		// 最终余额 = 500 - 200 + 100 - 150 = 250
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(250);
		expect(state.balance!.totalEarned).toBe(600); // 500 + 100
		expect(state.balance!.totalSpent).toBe(350); // 200 + 150

		// 交易记录：2 笔发放 + 2 笔消费 = 4
		expect(state.transactions).toHaveLength(4);

		// 余额 = 活跃批次 remaining 之和
		const totalRemaining = state.batches
			.filter((b) => ["active", "consumed"].includes(b.status))
			.reduce((sum, b) => sum + b.remaining, 0);
		expect(state.balance!.balance).toBe(totalRemaining);
	});

	it("发放 → 过期处理 → 消费 后数据应一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 发放 200（立即过期）
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 300,
			totalEarned: 300,
		});

		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 200,
			remaining: 200,
			status: "active",
			expiresAt: expiredDate(),
		});

		// 发放 100（未过期）
		await createTestCreditsBatch({
			userId: testUser.id,
			amount: 100,
			remaining: 100,
			status: "active",
			expiresAt: daysFromNow(30),
		});

		// 过期处理
		await processExpiredBatches();

		// 余额应为 300 - 200 = 100
		const stateAfterExpiry = await getUserCreditsState(testUser.id);
		expect(stateAfterExpiry.balance!.balance).toBe(100);

		// 消费 50
		await consumeCredits({
			userId: testUser.id,
			amount: 50,
			serviceName: "test_service",
		});

		// 最终余额 = 100 - 50 = 50
		const finalState = await getUserCreditsState(testUser.id);
		expect(finalState.balance!.balance).toBe(50);

		// 余额 = 活跃批次 remaining 之和
		const totalActiveRemaining = finalState.batches
			.filter((b) => b.status === "active")
			.reduce((sum, b) => sum + b.remaining, 0);
		expect(finalState.balance!.balance).toBe(totalActiveRemaining);
	});

	it("完全消费所有积分后余额和批次状态应一致", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 发放 100
		await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "bonus",
			debitAccount: "SYSTEM:test",
			transactionType: "registration_bonus",
			sourceRef: `seq_drain_${Date.now()}`,
		});

		// 消费全部 100
		await consumeCredits({
			userId: testUser.id,
			amount: 100,
			serviceName: "test_service",
		});

		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(0);
		expect(state.balance!.totalEarned).toBe(100);
		expect(state.balance!.totalSpent).toBe(100);

		// 批次应为 consumed
		expect(state.batches[0]!.remaining).toBe(0);
		expect(state.batches[0]!.status).toBe("consumed");

		// 再次消费应失败
		await expect(
			consumeCredits({
				userId: testUser.id,
				amount: 1,
				serviceName: "test_service",
			})
		).rejects.toThrow();

		// 余额仍为 0
		const finalState = await getUserCreditsState(testUser.id);
		expect(finalState.balance!.balance).toBe(0);
	});
});
