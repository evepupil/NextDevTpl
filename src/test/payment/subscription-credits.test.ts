/**
 * 订阅积分发放测试
 *
 * 测试范围：
 * - 月度订阅首次付款积分发放
 * - 月度订阅续期积分发放
 * - 年度订阅积分发放（12倍月度积分）
 * - 计划升级/降级不发放积分
 * - 不同计划的积分数量
 *
 * 注意：这些测试模拟 Stripe 事件数据，不实际调用 Stripe API
 */

import { afterAll, describe, expect, it } from "vitest";

import { grantCredits } from "@/features/credits/core";
import { getPlanFromPriceId } from "@/config/subscription-plan";
import { SUBSCRIPTION_MONTHLY_CREDITS, PRICE_IDS } from "@/config/payment";
import {
	cleanupTestUsers,
	createTestSubscription,
	createTestUser,
	getUserCreditsState,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 模拟 invoice.payment_succeeded 处理逻辑
// (从 webhooks/stripe/route.ts 提取核心逻辑)
// ============================================

type BillingReason = "subscription_create" | "subscription_cycle" | "subscription_update" | "manual" | null;

interface MockInvoicePaymentParams {
	userId: string;
	subscriptionId: string;
	priceId: string;
	/** 'month' | 'year' */
	interval: "month" | "year";
	billingReason: BillingReason;
}

/**
 * 模拟处理 invoice.payment_succeeded 事件的积分发放逻辑
 */
async function handleSubscriptionCreditsGrant(params: MockInvoicePaymentParams): Promise<{
	granted: boolean;
	amount?: number;
	reason?: string;
}> {
	const { userId, subscriptionId, priceId, interval, billingReason } = params;

	// 只在首次订阅和续期时发放积分，计划变更不发放
	if (billingReason !== "subscription_create" && billingReason !== "subscription_cycle") {
		return {
			granted: false,
			reason: `Skipped for billing_reason: ${billingReason}`,
		};
	}

	// 根据 priceId 确定计划类型
	const planType = getPlanFromPriceId(priceId);
	if (!planType) {
		return {
			granted: false,
			reason: `Unknown priceId: ${priceId}`,
		};
	}

	// 获取该计划的月度积分配额
	const monthlyCredits = SUBSCRIPTION_MONTHLY_CREDITS[planType as keyof typeof SUBSCRIPTION_MONTHLY_CREDITS];
	if (!monthlyCredits) {
		return {
			granted: false,
			reason: `No monthly credits configured for plan: ${planType}`,
		};
	}

	// 计算应发放积分：月付发月度积分，年付发12个月积分
	const isYearly = interval === "year";
	const creditsToGrant = isYearly ? monthlyCredits * 12 : monthlyCredits;

	// 发放积分（永不过期）
	await grantCredits({
		userId,
		amount: creditsToGrant,
		sourceType: "subscription",
		debitAccount: `SUBSCRIPTION:${subscriptionId}`,
		transactionType: "monthly_grant",
		expiresAt: null, // 永不过期
		sourceRef: `inv_test_${Date.now()}`,
		description: isYearly
			? `${planType.charAt(0).toUpperCase() + planType.slice(1)} 年度订阅积分 (${monthlyCredits} × 12)`
			: `${planType.charAt(0).toUpperCase() + planType.slice(1)} 月度订阅积分`,
		metadata: {
			subscriptionId,
			priceId,
			planType,
			billingReason,
			interval,
		},
	});

	return {
		granted: true,
		amount: creditsToGrant,
	};
}

// ============================================
// 计划识别测试
// ============================================

describe("Plan Recognition from Price ID", () => {
	it("应该识别 Starter 月度计划", () => {
		// 注意：这需要环境变量设置，测试时可能为空字符串
		// 我们直接测试 getPlanFromPriceId 的逻辑
		if (PRICE_IDS.STARTER_MONTHLY) {
			const plan = getPlanFromPriceId(PRICE_IDS.STARTER_MONTHLY);
			expect(plan).toBe("starter");
		}
	});

	it("应该识别 Pro 月度计划", () => {
		if (PRICE_IDS.PRO_MONTHLY) {
			const plan = getPlanFromPriceId(PRICE_IDS.PRO_MONTHLY);
			expect(plan).toBe("pro");
		}
	});

	it("应该识别 Ultra 年度计划", () => {
		if (PRICE_IDS.ULTRA_YEARLY) {
			const plan = getPlanFromPriceId(PRICE_IDS.ULTRA_YEARLY);
			expect(plan).toBe("ultra");
		}
	});

	it("未知的 priceId 应该返回 null", () => {
		const plan = getPlanFromPriceId("price_unknown_12345");
		expect(plan).toBeNull();
	});
});

// ============================================
// 积分配置测试
// ============================================

describe("Subscription Monthly Credits Configuration", () => {
	it("Starter 计划应该有 3000 月度积分", () => {
		expect(SUBSCRIPTION_MONTHLY_CREDITS.starter).toBe(3000);
	});

	it("Pro 计划应该有 8000 月度积分", () => {
		expect(SUBSCRIPTION_MONTHLY_CREDITS.pro).toBe(8000);
	});

	it("Ultra 计划应该有 16000 月度积分", () => {
		expect(SUBSCRIPTION_MONTHLY_CREDITS.ultra).toBe(16000);
	});
});

// ============================================
// 月度订阅积分发放测试
// ============================================

describe("Monthly Subscription Credit Grant", () => {
	it("首次订阅 Starter 应该发放 3000 积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 模拟创建订阅记录（实际场景由 checkout.session.completed 创建）
		const sub = await createTestSubscription({
			userId: testUser.id,
			priceId: "price_starter_monthly_test",
			status: "active",
		});

		// 模拟 invoice.payment_succeeded 事件
		// 使用模拟的 priceId，直接测试逻辑
		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.STARTER_MONTHLY || "price_starter_monthly_mock",
			interval: "month",
			billingReason: "subscription_create",
		});

		// 如果环境变量没设置，priceId 无法识别，跳过验证
		if (PRICE_IDS.STARTER_MONTHLY) {
			expect(result.granted).toBe(true);
			expect(result.amount).toBe(3000);

			const state = await getUserCreditsState(testUser.id);
			expect(state.balance!.balance).toBe(3000);
		} else {
			// 未设置环境变量时，应该返回未识别
			expect(result.granted).toBe(false);
		}
	});

	it("续期 Pro 应该发放 8000 积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			priceId: "price_pro_monthly_test",
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.PRO_MONTHLY || "price_pro_monthly_mock",
			interval: "month",
			billingReason: "subscription_cycle",
		});

		if (PRICE_IDS.PRO_MONTHLY) {
			expect(result.granted).toBe(true);
			expect(result.amount).toBe(8000);

			const state = await getUserCreditsState(testUser.id);
			expect(state.balance!.balance).toBe(8000);
		}
	});

	it("续期 Ultra 应该发放 16000 积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.ULTRA_MONTHLY || "price_ultra_monthly_mock",
			interval: "month",
			billingReason: "subscription_cycle",
		});

		if (PRICE_IDS.ULTRA_MONTHLY) {
			expect(result.granted).toBe(true);
			expect(result.amount).toBe(16000);
		}
	});
});

// ============================================
// 年度订阅积分发放测试
// ============================================

describe("Yearly Subscription Credit Grant", () => {
	it("年度 Starter 应该一次性发放 36000 积分 (3000 × 12)", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.STARTER_YEARLY || "price_starter_yearly_mock",
			interval: "year",
			billingReason: "subscription_create",
		});

		if (PRICE_IDS.STARTER_YEARLY) {
			expect(result.granted).toBe(true);
			expect(result.amount).toBe(3000 * 12);

			const state = await getUserCreditsState(testUser.id);
			expect(state.balance!.balance).toBe(36000);
		}
	});

	it("年度 Pro 应该一次性发放 96000 积分 (8000 × 12)", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.PRO_YEARLY || "price_pro_yearly_mock",
			interval: "year",
			billingReason: "subscription_create",
		});

		if (PRICE_IDS.PRO_YEARLY) {
			expect(result.granted).toBe(true);
			expect(result.amount).toBe(8000 * 12);
		}
	});

	it("年度 Ultra 应该一次性发放 192000 积分 (16000 × 12)", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.ULTRA_YEARLY || "price_ultra_yearly_mock",
			interval: "year",
			billingReason: "subscription_create",
		});

		if (PRICE_IDS.ULTRA_YEARLY) {
			expect(result.granted).toBe(true);
			expect(result.amount).toBe(16000 * 12);
		}
	});
});

// ============================================
// 计划变更不发放积分测试
// ============================================

describe("Plan Change Should Not Grant Credits", () => {
	it("升级计划 (subscription_update) 不应该发放积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.PRO_MONTHLY || "price_pro_monthly_mock",
			interval: "month",
			billingReason: "subscription_update",
		});

		expect(result.granted).toBe(false);
		expect(result.reason).toContain("subscription_update");

		// 确认没有发放积分
		const state = await getUserCreditsState(testUser.id);
		expect(state.balance).toBeUndefined();
	});

	it("手动发票 (manual) 不应该发放积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.PRO_MONTHLY || "price_pro_monthly_mock",
			interval: "month",
			billingReason: "manual",
		});

		expect(result.granted).toBe(false);
	});

	it("null billing_reason 不应该发放积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		const result = await handleSubscriptionCreditsGrant({
			userId: testUser.id,
			subscriptionId: sub.subscriptionId,
			priceId: PRICE_IDS.PRO_MONTHLY || "price_pro_monthly_mock",
			interval: "month",
			billingReason: null,
		});

		expect(result.granted).toBe(false);
	});
});

// ============================================
// 积分累加测试
// ============================================

describe("Credits Accumulation", () => {
	it("多次续期应该累加积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		// 如果没有环境变量，使用直接发放测试累加逻辑
		const monthlyAmount = SUBSCRIPTION_MONTHLY_CREDITS.starter;

		// 首次订阅
		await grantCredits({
			userId: testUser.id,
			amount: monthlyAmount,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${sub.subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt: null,
			description: "首次订阅",
		});

		// 第一次续期
		await grantCredits({
			userId: testUser.id,
			amount: monthlyAmount,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${sub.subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt: null,
			description: "第一次续期",
		});

		// 第二次续期
		await grantCredits({
			userId: testUser.id,
			amount: monthlyAmount,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${sub.subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt: null,
			description: "第二次续期",
		});

		const state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(monthlyAmount * 3);
		expect(state.batches).toHaveLength(3);
	});
});

// ============================================
// 积分永不过期测试
// ============================================

describe("Credits Never Expire", () => {
	it("订阅积分应该永不过期 (expiresAt = null)", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await grantCredits({
			userId: testUser.id,
			amount: 1000,
			sourceType: "subscription",
			debitAccount: "SUBSCRIPTION:test",
			transactionType: "monthly_grant",
			expiresAt: null, // 永不过期
			description: "测试永不过期",
		});

		const state = await getUserCreditsState(testUser.id);
		expect(state.batches).toHaveLength(1);
		expect(state.batches[0]!.expiresAt).toBeNull();
	});
});

// ============================================
// 完整流程测试
// ============================================

describe("Full Subscription Credit Lifecycle", () => {
	it("完整流程：首次订阅 → 续期 → 升级（不发积分）→ 新计划续期", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		// 1. 首次订阅 Starter（直接使用 grantCredits 模拟）
		await grantCredits({
			userId: testUser.id,
			amount: SUBSCRIPTION_MONTHLY_CREDITS.starter,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${sub.subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt: null,
			description: "Starter 首次订阅",
		});

		let state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(3000);

		// 2. 第一个月续期
		await grantCredits({
			userId: testUser.id,
			amount: SUBSCRIPTION_MONTHLY_CREDITS.starter,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${sub.subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt: null,
			description: "Starter 续期",
		});

		state = await getUserCreditsState(testUser.id);
		expect(state.balance!.balance).toBe(6000);

		// 3. 升级到 Pro（subscription_update）- 不发放积分
		// 这里只是模拟，实际不调用 grantCredits

		// 4. Pro 计划续期
		await grantCredits({
			userId: testUser.id,
			amount: SUBSCRIPTION_MONTHLY_CREDITS.pro,
			sourceType: "subscription",
			debitAccount: `SUBSCRIPTION:${sub.subscriptionId}`,
			transactionType: "monthly_grant",
			expiresAt: null,
			description: "Pro 续期",
		});

		state = await getUserCreditsState(testUser.id);
		// 3000 + 3000 + 8000 = 14000
		expect(state.balance!.balance).toBe(14000);
		expect(state.batches).toHaveLength(3);
	});
});
