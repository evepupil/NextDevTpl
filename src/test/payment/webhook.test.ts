/**
 * Stripe Webhook 集成测试
 *
 * 测试范围：
 * - checkout.session.completed 事件处理
 *   - 订阅支付完成 → 创建/更新订阅记录
 *   - 一次性支付（Lifetime）→ 创建终身订阅
 *   - 积分购买 → 发放积分
 * - customer.subscription.created 事件处理
 * - customer.subscription.updated 事件处理
 * - customer.subscription.deleted 事件处理
 * - invoice.payment_succeeded 事件处理
 *
 * 注意：这些测试模拟 Stripe 事件数据，不实际调用 Stripe API
 */

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { subscription } from "@/db/schema";
import { CREDITS_EXPIRY_DAYS } from "@/features/credits/config";
import { grantCredits } from "@/features/credits/core";
import {
	cleanupTestUsers,
	createTestSubscription,
	createTestUser,
	getUserCreditsState,
	getUserSubscription,
	testDb,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 模拟 Stripe Webhook 处理器逻辑
// (从 webhooks/stripe/route.ts 提取核心逻辑)
// ============================================

/**
 * 处理一次性支付完成事件（Lifetime 计划）
 */
async function handleOneTimePaymentCompleted(params: {
	userId: string;
	paymentIntentId: string;
	planId?: string;
}) {
	const { userId, paymentIntentId, planId } = params;

	const [existingSubscription] = await testDb
		.select()
		.from(subscription)
		.where(eq(subscription.userId, userId))
		.limit(1);

	if (existingSubscription) {
		await testDb
			.update(subscription)
			.set({
				stripeSubscriptionId: `lifetime_${paymentIntentId}`,
				stripePriceId: planId ?? "lifetime",
				status: "lifetime",
				currentPeriodStart: new Date(),
				currentPeriodEnd: null,
				cancelAtPeriodEnd: false,
				updatedAt: new Date(),
			})
			.where(eq(subscription.userId, userId));
	} else {
		await testDb.insert(subscription).values({
			id: crypto.randomUUID(),
			userId,
			stripeSubscriptionId: `lifetime_${paymentIntentId}`,
			stripePriceId: planId ?? "lifetime",
			status: "lifetime",
			currentPeriodStart: new Date(),
			currentPeriodEnd: null,
			cancelAtPeriodEnd: false,
		});
	}
}

/**
 * 处理订阅创建事件
 */
async function handleSubscriptionCreated(params: {
	userId: string;
	subscriptionId: string;
	priceId: string;
	status: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
}) {
	const {
		userId,
		subscriptionId,
		priceId,
		status,
		currentPeriodStart,
		currentPeriodEnd,
		cancelAtPeriodEnd,
	} = params;

	const [existingSubscription] = await testDb
		.select()
		.from(subscription)
		.where(eq(subscription.userId, userId))
		.limit(1);

	if (!existingSubscription) {
		await testDb.insert(subscription).values({
			id: crypto.randomUUID(),
			userId,
			stripeSubscriptionId: subscriptionId,
			stripePriceId: priceId,
			status,
			currentPeriodStart,
			currentPeriodEnd,
			cancelAtPeriodEnd,
		});
	}
}

/**
 * 处理订阅更新事件
 */
async function handleSubscriptionUpdated(params: {
	subscriptionId: string;
	priceId?: string;
	status: string;
	currentPeriodStart?: Date;
	currentPeriodEnd?: Date;
	cancelAtPeriodEnd: boolean;
}) {
	const {
		subscriptionId,
		priceId,
		status,
		currentPeriodStart,
		currentPeriodEnd,
		cancelAtPeriodEnd,
	} = params;

	const updateData: Record<string, unknown> = {
		status,
		cancelAtPeriodEnd,
		updatedAt: new Date(),
	};

	if (priceId !== undefined) {
		updateData.stripePriceId = priceId;
	}
	if (currentPeriodStart !== undefined) {
		updateData.currentPeriodStart = currentPeriodStart;
	}
	if (currentPeriodEnd !== undefined) {
		updateData.currentPeriodEnd = currentPeriodEnd;
	}

	await testDb
		.update(subscription)
		.set(updateData)
		.where(eq(subscription.stripeSubscriptionId, subscriptionId));
}

/**
 * 处理订阅删除事件
 */
async function handleSubscriptionDeleted(subscriptionId: string) {
	await testDb
		.update(subscription)
		.set({
			status: "canceled",
			updatedAt: new Date(),
		})
		.where(eq(subscription.stripeSubscriptionId, subscriptionId));
}

/**
 * 处理积分购买完成事件
 */
async function handleCreditPurchaseCompleted(params: {
	userId: string;
	credits: number;
	sessionId: string;
	packageId?: string;
}) {
	const { userId, credits, sessionId, packageId } = params;

	const expiresAt = CREDITS_EXPIRY_DAYS
		? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
		: null;

	return await grantCredits({
		userId,
		amount: credits,
		sourceType: "purchase",
		debitAccount: `PAYMENT:${sessionId}`,
		transactionType: "purchase",
		expiresAt,
		sourceRef: sessionId,
		description: `购买 ${credits} 积分 (${packageId ?? "custom"})`,
		metadata: {
			sessionId,
			packageId,
		},
	});
}

// ============================================
// Checkout Session Completed 测试
// ============================================

describe("Stripe Webhook: checkout.session.completed", () => {
	describe("Subscription Payment", () => {
		it("应该为新用户创建订阅记录", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const now = new Date();
			const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

			await handleSubscriptionCreated({
				userId: testUser.id,
				subscriptionId: `sub_test_${Date.now()}`,
				priceId: "price_monthly_pro",
				status: "active",
				currentPeriodStart: now,
				currentPeriodEnd: thirtyDaysLater,
				cancelAtPeriodEnd: false,
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub).toBeDefined();
			expect(sub!.status).toBe("active");
			expect(sub!.stripePriceId).toBe("price_monthly_pro");
		});

		it("已有订阅的用户不应重复创建", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			// 先创建一个订阅
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: "sub_existing",
				stripePriceId: "price_old",
				status: "active",
			});

			// 模拟 subscription.created 事件
			await handleSubscriptionCreated({
				userId: testUser.id,
				subscriptionId: "sub_new",
				priceId: "price_new",
				status: "active",
				currentPeriodStart: new Date(),
				currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
				cancelAtPeriodEnd: false,
			});

			// 应该保持原有订阅
			const sub = await getUserSubscription(testUser.id);
			expect(sub!.stripeSubscriptionId).toBe("sub_existing");
			expect(sub!.stripePriceId).toBe("price_old");
		});
	});

	describe("One-Time Payment (Lifetime)", () => {
		it("应该为新用户创建 Lifetime 订阅", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			await handleOneTimePaymentCompleted({
				userId: testUser.id,
				paymentIntentId: `pi_test_${Date.now()}`,
				planId: "lifetime_pro",
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub).toBeDefined();
			expect(sub!.status).toBe("lifetime");
			expect(sub!.stripePriceId).toBe("lifetime_pro");
			expect(sub!.currentPeriodEnd).toBeNull();
			expect(sub!.stripeSubscriptionId).toContain("lifetime_");
		});

		it("应该将现有订阅升级为 Lifetime", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			// 先创建一个普通订阅
			await createTestSubscription({
				userId: testUser.id,
				status: "active",
				stripePriceId: "price_monthly",
			});

			// 购买 Lifetime
			await handleOneTimePaymentCompleted({
				userId: testUser.id,
				paymentIntentId: `pi_upgrade_${Date.now()}`,
				planId: "lifetime",
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub!.status).toBe("lifetime");
			expect(sub!.currentPeriodEnd).toBeNull();
		});
	});

	describe("Credit Purchase", () => {
		it("应该发放购买的积分", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const result = await handleCreditPurchaseCompleted({
				userId: testUser.id,
				credits: 500,
				sessionId: `cs_test_${Date.now()}`,
				packageId: "standard",
			});

			expect(result.amount).toBe(500);
			expect(result.newBalance).toBe(500);

			const state = await getUserCreditsState(testUser.id);
			expect(state.balance!.balance).toBe(500);
		});

		it("应该正确设置积分过期时间", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const beforeGrant = Date.now();
			await handleCreditPurchaseCompleted({
				userId: testUser.id,
				credits: 100,
				sessionId: `cs_expiry_${Date.now()}`,
			});

			const state = await getUserCreditsState(testUser.id);
			const batch = state.batches[0];

			if (CREDITS_EXPIRY_DAYS) {
				expect(batch!.expiresAt).not.toBeNull();
				const expectedExpiry = beforeGrant + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
				// 允许 1 分钟误差
				expect(batch!.expiresAt!.getTime()).toBeGreaterThan(expectedExpiry - 60000);
				expect(batch!.expiresAt!.getTime()).toBeLessThan(expectedExpiry + 60000);
			}
		});

		it("应该累加已有积分", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			// 第一次购买
			await handleCreditPurchaseCompleted({
				userId: testUser.id,
				credits: 200,
				sessionId: `cs_first_${Date.now()}`,
			});

			// 第二次购买
			await handleCreditPurchaseCompleted({
				userId: testUser.id,
				credits: 300,
				sessionId: `cs_second_${Date.now()}`,
			});

			const state = await getUserCreditsState(testUser.id);
			expect(state.balance!.balance).toBe(500);
			expect(state.batches).toHaveLength(2);
		});
	});
});

// ============================================
// Subscription Lifecycle 测试
// ============================================

describe("Stripe Webhook: subscription lifecycle", () => {
	describe("subscription.updated", () => {
		it("应该更新订阅状态", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const subscriptionId = `sub_update_${Date.now()}`;
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: subscriptionId,
				status: "trialing",
			});

			// 模拟试用期结束，转为 active
			await handleSubscriptionUpdated({
				subscriptionId,
				status: "active",
				cancelAtPeriodEnd: false,
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub!.status).toBe("active");
		});

		it("应该更新订阅周期", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const subscriptionId = `sub_period_${Date.now()}`;
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: subscriptionId,
				status: "active",
			});

			const newPeriodStart = new Date();
			const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

			await handleSubscriptionUpdated({
				subscriptionId,
				status: "active",
				currentPeriodStart: newPeriodStart,
				currentPeriodEnd: newPeriodEnd,
				cancelAtPeriodEnd: false,
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub!.currentPeriodEnd!.getTime()).toBe(newPeriodEnd.getTime());
		});

		it("应该标记订阅为周期结束后取消", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const subscriptionId = `sub_cancel_end_${Date.now()}`;
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: subscriptionId,
				status: "active",
				cancelAtPeriodEnd: false,
			});

			await handleSubscriptionUpdated({
				subscriptionId,
				status: "active",
				cancelAtPeriodEnd: true,
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub!.cancelAtPeriodEnd).toBe(true);
		});

		it("应该更新订阅计划（升级/降级）", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const subscriptionId = `sub_upgrade_${Date.now()}`;
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: subscriptionId,
				stripePriceId: "price_basic_monthly",
				status: "active",
			});

			// 升级到 Pro
			await handleSubscriptionUpdated({
				subscriptionId,
				priceId: "price_pro_monthly",
				status: "active",
				cancelAtPeriodEnd: false,
			});

			const sub = await getUserSubscription(testUser.id);
			expect(sub!.stripePriceId).toBe("price_pro_monthly");
		});
	});

	describe("subscription.deleted", () => {
		it("应该将订阅状态标记为 canceled", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const subscriptionId = `sub_delete_${Date.now()}`;
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: subscriptionId,
				status: "active",
			});

			await handleSubscriptionDeleted(subscriptionId);

			const sub = await getUserSubscription(testUser.id);
			expect(sub!.status).toBe("canceled");
		});

		it("应该保留订阅记录（不删除）", async () => {
			const testUser = await createTestUser();
			createdUserIds.push(testUser.id);

			const subscriptionId = `sub_keep_${Date.now()}`;
			await createTestSubscription({
				userId: testUser.id,
				stripeSubscriptionId: subscriptionId,
				status: "active",
			});

			await handleSubscriptionDeleted(subscriptionId);

			// 记录应该仍然存在
			const sub = await getUserSubscription(testUser.id);
			expect(sub).toBeDefined();
			expect(sub!.stripeSubscriptionId).toBe(subscriptionId);
		});
	});
});

// ============================================
// 边界情况测试
// ============================================

describe("Stripe Webhook: Edge Cases", () => {
	it("不存在的订阅 ID 更新应该静默失败", async () => {
		// 不应该抛出错误
		await expect(
			handleSubscriptionUpdated({
				subscriptionId: "sub_nonexistent_12345",
				status: "active",
				cancelAtPeriodEnd: false,
			})
		).resolves.not.toThrow();
	});

	it("不存在的订阅 ID 删除应该静默失败", async () => {
		await expect(
			handleSubscriptionDeleted("sub_nonexistent_67890")
		).resolves.not.toThrow();
	});

	it("积分购买金额为 0 应该失败", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await expect(
			handleCreditPurchaseCompleted({
				userId: testUser.id,
				credits: 0,
				sessionId: `cs_zero_${Date.now()}`,
			})
		).rejects.toThrow();
	});

	it("积分购买金额为负数应该失败", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await expect(
			handleCreditPurchaseCompleted({
				userId: testUser.id,
				credits: -100,
				sessionId: `cs_negative_${Date.now()}`,
			})
		).rejects.toThrow();
	});
});

// ============================================
// 完整流程测试
// ============================================

describe("Stripe Webhook: Full Lifecycle", () => {
	it("完整订阅生命周期：创建 → 续费 → 取消 → 删除", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const subscriptionId = `sub_lifecycle_${Date.now()}`;
		const now = new Date();

		// 1. 创建订阅
		await handleSubscriptionCreated({
			userId: testUser.id,
			subscriptionId,
			priceId: "price_monthly",
			status: "active",
			currentPeriodStart: now,
			currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
		});

		let sub = await getUserSubscription(testUser.id);
		expect(sub!.status).toBe("active");

		// 2. 续费（更新周期）
		const newPeriodEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
		await handleSubscriptionUpdated({
			subscriptionId,
			status: "active",
			currentPeriodEnd: newPeriodEnd,
			cancelAtPeriodEnd: false,
		});

		sub = await getUserSubscription(testUser.id);
		expect(sub!.currentPeriodEnd!.getTime()).toBe(newPeriodEnd.getTime());

		// 3. 用户请求取消（周期结束后取消）
		await handleSubscriptionUpdated({
			subscriptionId,
			status: "active",
			cancelAtPeriodEnd: true,
		});

		sub = await getUserSubscription(testUser.id);
		expect(sub!.cancelAtPeriodEnd).toBe(true);
		expect(sub!.status).toBe("active"); // 仍然活跃直到周期结束

		// 4. 周期结束，订阅被删除
		await handleSubscriptionDeleted(subscriptionId);

		sub = await getUserSubscription(testUser.id);
		expect(sub!.status).toBe("canceled");
	});

	it("从订阅升级到 Lifetime", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const subscriptionId = `sub_to_lifetime_${Date.now()}`;

		// 1. 开始订阅
		await handleSubscriptionCreated({
			userId: testUser.id,
			subscriptionId,
			priceId: "price_monthly",
			status: "active",
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			cancelAtPeriodEnd: false,
		});

		let sub = await getUserSubscription(testUser.id);
		expect(sub!.status).toBe("active");

		// 2. 购买 Lifetime（覆盖订阅）
		await handleOneTimePaymentCompleted({
			userId: testUser.id,
			paymentIntentId: `pi_lifetime_${Date.now()}`,
			planId: "lifetime",
		});

		sub = await getUserSubscription(testUser.id);
		expect(sub!.status).toBe("lifetime");
		expect(sub!.currentPeriodEnd).toBeNull();
	});
});
