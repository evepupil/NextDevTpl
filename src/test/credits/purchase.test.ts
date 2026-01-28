/**
 * 积分购买流程集成测试
 *
 * 测试范围：
 * - 积分套餐配置验证
 * - 注册奖励发放
 * - 月度订阅积分发放
 * - 积分购买发放
 * - 懒加载注册奖励机制
 *
 * 注意：这些测试验证业务逻辑，不实际调用 Stripe API
 */

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { creditsTransaction } from "@/db/schema";
import {
	CREDIT_PACKAGES,
	CREDITS_EXPIRY_DAYS,
	MONTHLY_SUBSCRIPTION_CREDITS,
	REGISTRATION_BONUS_CREDITS,
} from "@/features/credits/config";
import {
	ensureRegistrationBonus,
	getCreditsBalance,
	grantCredits,
} from "@/features/credits/core";
import {
	cleanupTestUsers,
	createTestUser,
	getUserCreditsState,
	testDb,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 积分套餐配置测试
// ============================================

describe("Credit Package Config", () => {
	it("应该有三个套餐（lite, standard, pro）", () => {
		expect(CREDIT_PACKAGES).toHaveLength(3);

		const ids = CREDIT_PACKAGES.map((p) => p.id);
		expect(ids).toContain("lite");
		expect(ids).toContain("standard");
		expect(ids).toContain("pro");
	});

	it("所有套餐应该有必要字段", () => {
		for (const pkg of CREDIT_PACKAGES) {
			expect(pkg.id).toBeDefined();
			expect(pkg.name).toBeDefined();
			expect(pkg.credits).toBeGreaterThan(0);
			expect(pkg.price).toBeGreaterThan(0);
			expect(pkg.description).toBeDefined();
		}
	});

	it("Standard 套餐应该标记为 popular", () => {
		const standard = CREDIT_PACKAGES.find((p) => p.id === "standard");
		expect(standard).toBeDefined();
		expect("popular" in standard!).toBe(true);
		expect(standard!.popular).toBe(true);
	});

	it("套餐积分应该按价格递增", () => {
		// 按价格排序
		const sorted = [...CREDIT_PACKAGES].sort((a, b) => a.price - b.price);

		// 验证积分也是递增的
		for (let i = 1; i < sorted.length; i++) {
			expect(sorted[i]!.credits).toBeGreaterThan(sorted[i - 1]!.credits);
		}
	});

	it("应该配置正确的系统常量", () => {
		expect(REGISTRATION_BONUS_CREDITS).toBeGreaterThan(0);
		expect(MONTHLY_SUBSCRIPTION_CREDITS).toBeGreaterThan(0);
		// CREDITS_EXPIRY_DAYS 可以是 null 或正数
		if (CREDITS_EXPIRY_DAYS !== null) {
			expect(CREDITS_EXPIRY_DAYS).toBeGreaterThan(0);
		}
	});
});

// ============================================
// 注册奖励测试
// ============================================

describe("Registration Bonus", () => {
	it("应该为新用户发放注册奖励", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const expiresAt = CREDITS_EXPIRY_DAYS
			? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
			: null;

		const result = await grantCredits({
			userId: testUser.id,
			amount: REGISTRATION_BONUS_CREDITS,
			sourceType: "bonus",
			debitAccount: "SYSTEM:registration_bonus",
			transactionType: "registration_bonus",
			expiresAt,
			description: "新用户注册奖励",
			metadata: {
				bonusType: "registration",
			},
		});

		expect(result.amount).toBe(REGISTRATION_BONUS_CREDITS);
		expect(result.newBalance).toBe(REGISTRATION_BONUS_CREDITS);

		// 验证数据库状态
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(REGISTRATION_BONUS_CREDITS);
		expect(state.batches).toHaveLength(1);
		expect(state.batches[0]!.sourceType).toBe("bonus");
	});

	it("懒加载应该只发放一次注册奖励", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 第一次调用 - 应该发放奖励
		await ensureRegistrationBonus(
			testUser.id,
			REGISTRATION_BONUS_CREDITS,
			CREDITS_EXPIRY_DAYS
		);

		const balanceAfterFirst = await getCreditsBalance(testUser.id);
		expect(balanceAfterFirst.balance).toBe(REGISTRATION_BONUS_CREDITS);

		// 第二次调用 - 不应该重复发放
		await ensureRegistrationBonus(
			testUser.id,
			REGISTRATION_BONUS_CREDITS,
			CREDITS_EXPIRY_DAYS
		);

		const balanceAfterSecond = await getCreditsBalance(testUser.id);
		expect(balanceAfterSecond.balance).toBe(REGISTRATION_BONUS_CREDITS);

		// 验证只有一个批次
		const state = await getUserCreditsState(testUser.id);
		expect(state.batches).toHaveLength(1);
	});

	it("已有交易记录的用户不应该获得注册奖励", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 先购买一些积分（模拟已有交易）
		await grantCredits({
			userId: testUser.id,
			amount: 50,
			sourceType: "purchase",
			debitAccount: "PAYMENT:test_purchase",
			transactionType: "purchase",
			expiresAt: null,
			description: "测试购买",
		});

		const balanceBefore = await getCreditsBalance(testUser.id);
		expect(balanceBefore.balance).toBe(50);

		// 尝试发放注册奖励 - 应该被跳过
		await ensureRegistrationBonus(
			testUser.id,
			REGISTRATION_BONUS_CREDITS,
			CREDITS_EXPIRY_DAYS
		);

		const balanceAfter = await getCreditsBalance(testUser.id);
		// 余额应该不变（只有购买的 50）
		expect(balanceAfter.balance).toBe(50);
	});
});

// ============================================
// 月度订阅积分测试
// ============================================

describe("Monthly Subscription Credits", () => {
	it("应该为订阅用户发放月度积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const subscriptionId = `sub_test_${Date.now()}`;
		const expiresAt = new Date();
		expiresAt.setMonth(expiresAt.getMonth() + 1);

		const result = await grantCredits({
			userId: testUser.id,
			amount: MONTHLY_SUBSCRIPTION_CREDITS,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt,
			sourceRef: subscriptionId,
			description: "月度订阅积分",
			metadata: {
				subscriptionId,
				grantType: "monthly",
			},
		});

		expect(result.amount).toBe(MONTHLY_SUBSCRIPTION_CREDITS);

		// 验证交易记录
		const [transaction] = await testDb
			.select()
			.from(creditsTransaction)
			.where(eq(creditsTransaction.userId, testUser.id))
			.limit(1);

		expect(transaction).toBeDefined();
		expect(transaction!.type).toBe("monthly_grant");
		expect(transaction!.debitAccount).toBe(`SUBSCRIPTION:${subscriptionId}`);
	});

	it("月度积分应该设置正确的过期时间（下个月）", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const beforeGrant = new Date();
		const subscriptionId = `sub_expiry_${Date.now()}`;
		const expiresAt = new Date();
		expiresAt.setMonth(expiresAt.getMonth() + 1);

		await grantCredits({
			userId: testUser.id,
			amount: MONTHLY_SUBSCRIPTION_CREDITS,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt,
			sourceRef: subscriptionId,
			description: "月度订阅积分",
		});

		const state = await getUserCreditsState(testUser.id);
		const batch = state.batches[0];

		expect(batch!.expiresAt).not.toBeNull();

		// 验证过期时间大约在一个月后（允许 1 分钟误差）
		const expectedExpiry = new Date(beforeGrant);
		expectedExpiry.setMonth(expectedExpiry.getMonth() + 1);

		expect(batch!.expiresAt!.getTime()).toBeGreaterThan(
			expectedExpiry.getTime() - 60000
		);
		expect(batch!.expiresAt!.getTime()).toBeLessThan(
			expectedExpiry.getTime() + 60000
		);
	});

	it("多次订阅续费应该累加积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 模拟三个月的订阅续费
		for (let i = 0; i < 3; i++) {
			const subscriptionId = `sub_month_${i}_${Date.now()}`;
			const expiresAt = new Date();
			expiresAt.setMonth(expiresAt.getMonth() + 1);

			await grantCredits({
				userId: testUser.id,
				amount: MONTHLY_SUBSCRIPTION_CREDITS,
				sourceType: "subscription",
				debitAccount: `SUBSCRIPTION:${subscriptionId}`,
				transactionType: "monthly_grant",
				expiresAt,
				sourceRef: subscriptionId,
				description: `月度订阅积分 #${i + 1}`,
			});
		}

		const balance = await getCreditsBalance(testUser.id);
		expect(balance.balance).toBe(MONTHLY_SUBSCRIPTION_CREDITS * 3);

		const state = await getUserCreditsState(testUser.id);
		expect(state.batches).toHaveLength(3);
	});
});

// ============================================
// 积分购买测试
// ============================================

describe("Credit Purchase", () => {
	it("应该正确发放购买的积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const paymentId = `pi_test_${Date.now()}`;
		const purchaseAmount = 500;

		const result = await grantCredits({
			userId: testUser.id,
			amount: purchaseAmount,
			sourceType: "purchase",
			debitAccount: `PAYMENT:${paymentId}`,
			transactionType: "purchase",
			expiresAt: CREDITS_EXPIRY_DAYS
				? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
				: null,
			sourceRef: paymentId,
			description: `购买 ${purchaseAmount} 积分`,
			metadata: {
				paymentId,
				purchaseType: "direct",
			},
		});

		expect(result.amount).toBe(purchaseAmount);
		expect(result.newBalance).toBe(purchaseAmount);

		// 验证交易记录
		const [transaction] = await testDb
			.select()
			.from(creditsTransaction)
			.where(eq(creditsTransaction.userId, testUser.id))
			.limit(1);

		expect(transaction!.type).toBe("purchase");
		expect(transaction!.debitAccount).toBe(`PAYMENT:${paymentId}`);
	});

	it("购买积分应该按套餐正确设置过期时间", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const beforeGrant = Date.now();
		const paymentId = `pi_expiry_${Date.now()}`;

		await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "purchase",
			debitAccount: `PAYMENT:${paymentId}`,
			transactionType: "purchase",
			expiresAt: CREDITS_EXPIRY_DAYS
				? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
				: null,
			sourceRef: paymentId,
			description: "购买积分",
		});

		const state = await getUserCreditsState(testUser.id);
		const batch = state.batches[0];

		if (CREDITS_EXPIRY_DAYS) {
			expect(batch!.expiresAt).not.toBeNull();
			const expectedExpiry =
				beforeGrant + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
			// 允许 1 分钟误差
			expect(batch!.expiresAt!.getTime()).toBeGreaterThan(expectedExpiry - 60000);
			expect(batch!.expiresAt!.getTime()).toBeLessThan(expectedExpiry + 60000);
		}
	});

	it("多次购买应该累加余额", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 购买 Lite 套餐
		await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "purchase",
			debitAccount: `PAYMENT:pi_lite_${Date.now()}`,
			transactionType: "purchase",
			expiresAt: null,
			description: "购买 Lite 套餐",
		});

		// 购买 Standard 套餐
		await grantCredits({
			userId: testUser.id,
			amount: 500,
			sourceType: "purchase",
			debitAccount: `PAYMENT:pi_standard_${Date.now()}`,
			transactionType: "purchase",
			expiresAt: null,
			description: "购买 Standard 套餐",
		});

		const balance = await getCreditsBalance(testUser.id);
		expect(balance.balance).toBe(600);
		expect(balance.totalEarned).toBe(600);

		const state = await getUserCreditsState(testUser.id);
		expect(state.batches).toHaveLength(2);
	});

	it("应该正确记录套餐元数据", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sessionId = `cs_test_${Date.now()}`;
		const packageId = "standard";
		const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId)!;

		await grantCredits({
			userId: testUser.id,
			amount: pkg.credits,
			sourceType: "purchase",
			debitAccount: `PAYMENT:${sessionId}`,
			transactionType: "purchase",
			expiresAt: null,
			sourceRef: sessionId,
			description: `购买 ${pkg.credits} 积分 (${packageId})`,
			metadata: {
				sessionId,
				packageId,
			},
		});

		const [transaction] = await testDb
			.select()
			.from(creditsTransaction)
			.where(eq(creditsTransaction.userId, testUser.id))
			.limit(1);

		expect(transaction!.metadata).toBeDefined();
		const metadata = transaction!.metadata as Record<string, unknown>;
		expect(metadata.sessionId).toBe(sessionId);
		expect(metadata.packageId).toBe(packageId);
	});
});

// ============================================
// 混合场景测试
// ============================================

describe("Mixed Credit Sources", () => {
	it("用户可以同时拥有多种来源的积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 1. 注册奖励
		await grantCredits({
			userId: testUser.id,
			amount: REGISTRATION_BONUS_CREDITS,
			sourceType: "bonus",
			debitAccount: "SYSTEM:registration_bonus",
			transactionType: "registration_bonus",
			expiresAt: null,
			description: "注册奖励",
		});

		// 2. 订阅积分
		await grantCredits({
			userId: testUser.id,
			amount: MONTHLY_SUBSCRIPTION_CREDITS,
			sourceType: "subscription",
			debitAccount: "SUBSCRIPTION:sub_test",
			transactionType: "monthly_grant",
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			description: "订阅积分",
		});

		// 3. 购买积分
		await grantCredits({
			userId: testUser.id,
			amount: 200,
			sourceType: "purchase",
			debitAccount: "PAYMENT:pi_test",
			transactionType: "purchase",
			expiresAt: null,
			description: "购买积分",
		});

		const balance = await getCreditsBalance(testUser.id);
		expect(balance.balance).toBe(
			REGISTRATION_BONUS_CREDITS + MONTHLY_SUBSCRIPTION_CREDITS + 200
		);

		const state = await getUserCreditsState(testUser.id);
		expect(state.batches).toHaveLength(3);

		// 验证各种来源类型
		const sourceTypes = state.batches.map((b) => b.sourceType);
		expect(sourceTypes).toContain("bonus");
		expect(sourceTypes).toContain("subscription");
		expect(sourceTypes).toContain("purchase");
	});

	it("totalEarned 应该正确累计所有来源", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const amounts = [100, 200, 300];
		for (let i = 0; i < amounts.length; i++) {
			await grantCredits({
				userId: testUser.id,
				amount: amounts[i]!,
				sourceType: "purchase",
				debitAccount: `PAYMENT:pi_${i}`,
				transactionType: "purchase",
				expiresAt: null,
				description: `购买 #${i + 1}`,
			});
		}

		const balance = await getCreditsBalance(testUser.id);
		expect(balance.totalEarned).toBe(600);
	});
});
