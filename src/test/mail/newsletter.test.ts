/**
 * Newsletter 邮件订阅集成测试
 *
 * 测试范围：
 * - 订阅新邮箱
 * - 重复订阅检测
 * - 取消订阅（软删除）
 * - 重新激活订阅
 * - 订阅状态查询
 * - 邮箱规范化（大小写、空格）
 */

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { newsletterSubscriber } from "@/db/schema";
import {
	cleanupTestNewsletterSubscribers,
	testDb,
} from "../utils";

// 收集测试中创建的订阅者邮箱，用于清理
const createdEmails: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestNewsletterSubscribers(createdEmails);
});

// ============================================
// 辅助函数：直接测试数据库操作
// (因为 server actions 需要 next.js 运行时)
// ============================================

/**
 * 订阅 Newsletter（模拟 subscribeNewsletter action 的逻辑）
 */
async function subscribeNewsletter(email: string) {
	const normalizedEmail = email.toLowerCase().trim();

	const [existing] = await testDb
		.select()
		.from(newsletterSubscriber)
		.where(eq(newsletterSubscriber.email, normalizedEmail))
		.limit(1);

	if (existing) {
		if (existing.isSubscribed) {
			return {
				success: true,
				message: "You are already subscribed!",
				alreadySubscribed: true,
			};
		}

		// 重新激活
		await testDb
			.update(newsletterSubscriber)
			.set({
				isSubscribed: true,
				subscribedAt: new Date(),
				unsubscribedAt: null,
				updatedAt: new Date(),
			})
			.where(eq(newsletterSubscriber.id, existing.id));

		return {
			success: true,
			message: "Welcome back! Your subscription has been reactivated.",
			reactivated: true,
		};
	}

	// 创建新订阅
	await testDb.insert(newsletterSubscriber).values({
		id: crypto.randomUUID(),
		email: normalizedEmail,
		isSubscribed: true,
	});

	createdEmails.push(normalizedEmail);

	return {
		success: true,
		message: "Thank you for subscribing!",
	};
}

/**
 * 取消订阅（模拟 unsubscribeNewsletter action 的逻辑）
 */
async function unsubscribeNewsletter(email: string) {
	const normalizedEmail = email.toLowerCase().trim();

	const [existing] = await testDb
		.select()
		.from(newsletterSubscriber)
		.where(eq(newsletterSubscriber.email, normalizedEmail))
		.limit(1);

	if (!existing) {
		return {
			success: false,
			message: "Email not found in our subscriber list.",
		};
	}

	if (!existing.isSubscribed) {
		return {
			success: true,
			message: "You are already unsubscribed.",
			alreadyUnsubscribed: true,
		};
	}

	await testDb
		.update(newsletterSubscriber)
		.set({
			isSubscribed: false,
			unsubscribedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(newsletterSubscriber.id, existing.id));

	return {
		success: true,
		message: "You have been unsubscribed. We're sorry to see you go!",
	};
}

/**
 * 检查订阅状态（模拟 checkSubscriptionStatus action 的逻辑）
 */
async function checkSubscriptionStatus(email: string) {
	const normalizedEmail = email.toLowerCase().trim();

	const [subscriber] = await testDb
		.select({
			isSubscribed: newsletterSubscriber.isSubscribed,
			subscribedAt: newsletterSubscriber.subscribedAt,
		})
		.from(newsletterSubscriber)
		.where(eq(newsletterSubscriber.email, normalizedEmail))
		.limit(1);

	if (!subscriber) {
		return {
			found: false,
			isSubscribed: false,
		};
	}

	return {
		found: true,
		isSubscribed: subscriber.isSubscribed,
		subscribedAt: subscriber.subscribedAt,
	};
}

// ============================================
// 订阅测试
// ============================================

describe("Newsletter Subscribe", () => {
	it("应该成功订阅新邮箱", async () => {
		const email = `test_sub_${Date.now()}@test.local`;

		const result = await subscribeNewsletter(email);

		expect(result.success).toBe(true);
		expect(result.message).toContain("Thank you");
		expect(result.alreadySubscribed).toBeUndefined();

		// 验证数据库记录
		const [subscriber] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, email.toLowerCase()))
			.limit(1);

		expect(subscriber).toBeDefined();
		expect(subscriber!.isSubscribed).toBe(true);
		expect(subscriber!.unsubscribedAt).toBeNull();
	});

	it("应该检测重复订阅", async () => {
		const email = `test_dup_${Date.now()}@test.local`;

		// 首次订阅
		await subscribeNewsletter(email);

		// 再次订阅
		const result = await subscribeNewsletter(email);

		expect(result.success).toBe(true);
		expect(result.alreadySubscribed).toBe(true);
		expect(result.message).toContain("already subscribed");
	});

	it("应该规范化邮箱地址（大小写）", async () => {
		const baseEmail = `test_case_${Date.now()}@test.local`;
		const upperEmail = baseEmail.toUpperCase();

		// 用大写邮箱订阅
		await subscribeNewsletter(upperEmail);

		// 数据库中应该存储为小写
		const [subscriber] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, baseEmail.toLowerCase()))
			.limit(1);

		expect(subscriber).toBeDefined();
		expect(subscriber!.email).toBe(baseEmail.toLowerCase());
	});

	it("应该规范化邮箱地址（去除空格）", async () => {
		const cleanEmail = `test_space_${Date.now()}@test.local`;
		const spacedEmail = `  ${cleanEmail}  `;

		await subscribeNewsletter(spacedEmail);

		const [subscriber] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, cleanEmail.toLowerCase()))
			.limit(1);

		expect(subscriber).toBeDefined();
		expect(subscriber!.email).toBe(cleanEmail.toLowerCase());
	});
});

// ============================================
// 取消订阅测试
// ============================================

describe("Newsletter Unsubscribe", () => {
	it("应该成功取消订阅", async () => {
		const email = `test_unsub_${Date.now()}@test.local`;

		// 先订阅
		await subscribeNewsletter(email);

		// 取消订阅
		const result = await unsubscribeNewsletter(email);

		expect(result.success).toBe(true);
		expect(result.message).toContain("unsubscribed");

		// 验证数据库记录
		const [subscriber] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, email.toLowerCase()))
			.limit(1);

		expect(subscriber).toBeDefined();
		expect(subscriber!.isSubscribed).toBe(false);
		expect(subscriber!.unsubscribedAt).not.toBeNull();
	});

	it("不存在的邮箱取消订阅应返回失败", async () => {
		const email = `nonexistent_${Date.now()}@test.local`;

		const result = await unsubscribeNewsletter(email);

		expect(result.success).toBe(false);
		expect(result.message).toContain("not found");
	});

	it("已取消的邮箱再次取消应返回提示", async () => {
		const email = `test_double_unsub_${Date.now()}@test.local`;

		// 订阅后取消
		await subscribeNewsletter(email);
		await unsubscribeNewsletter(email);

		// 再次取消
		const result = await unsubscribeNewsletter(email);

		expect(result.success).toBe(true);
		expect(result.alreadyUnsubscribed).toBe(true);
	});

	it("取消订阅不应删除记录（软删除）", async () => {
		const email = `test_soft_del_${Date.now()}@test.local`;

		await subscribeNewsletter(email);
		await unsubscribeNewsletter(email);

		// 记录应该仍然存在
		const [subscriber] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, email.toLowerCase()))
			.limit(1);

		expect(subscriber).toBeDefined();
		expect(subscriber!.isSubscribed).toBe(false);
	});
});

// ============================================
// 重新激活测试
// ============================================

describe("Newsletter Reactivation", () => {
	it("取消后重新订阅应该重新激活", async () => {
		const email = `test_reactivate_${Date.now()}@test.local`;

		// 订阅 → 取消 → 重新订阅
		await subscribeNewsletter(email);
		await unsubscribeNewsletter(email);
		const result = await subscribeNewsletter(email);

		expect(result.success).toBe(true);
		expect(result.reactivated).toBe(true);
		expect(result.message).toContain("Welcome back");

		// 验证数据库状态
		const [subscriber] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, email.toLowerCase()))
			.limit(1);

		expect(subscriber!.isSubscribed).toBe(true);
		expect(subscriber!.unsubscribedAt).toBeNull();
	});

	it("重新激活应更新 subscribedAt", async () => {
		const email = `test_reactivate_time_${Date.now()}@test.local`;

		await subscribeNewsletter(email);

		const [original] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, email.toLowerCase()))
			.limit(1);

		const originalSubscribedAt = original!.subscribedAt;

		// 等待一小段时间
		await new Promise((resolve) => setTimeout(resolve, 10));

		// 取消并重新激活
		await unsubscribeNewsletter(email);
		await subscribeNewsletter(email);

		const [reactivated] = await testDb
			.select()
			.from(newsletterSubscriber)
			.where(eq(newsletterSubscriber.email, email.toLowerCase()))
			.limit(1);

		expect(reactivated!.subscribedAt.getTime()).toBeGreaterThan(
			originalSubscribedAt.getTime()
		);
	});
});

// ============================================
// 状态查询测试
// ============================================

describe("Newsletter Subscription Status", () => {
	it("应该返回已订阅用户的状态", async () => {
		const email = `test_status_sub_${Date.now()}@test.local`;
		await subscribeNewsletter(email);

		const status = await checkSubscriptionStatus(email);

		expect(status.found).toBe(true);
		expect(status.isSubscribed).toBe(true);
		expect(status.subscribedAt).toBeDefined();
	});

	it("应该返回已取消用户的状态", async () => {
		const email = `test_status_unsub_${Date.now()}@test.local`;
		await subscribeNewsletter(email);
		await unsubscribeNewsletter(email);

		const status = await checkSubscriptionStatus(email);

		expect(status.found).toBe(true);
		expect(status.isSubscribed).toBe(false);
	});

	it("不存在的邮箱应返回 found: false", async () => {
		const email = `nonexistent_status_${Date.now()}@test.local`;

		const status = await checkSubscriptionStatus(email);

		expect(status.found).toBe(false);
		expect(status.isSubscribed).toBe(false);
	});

	it("状态查询应使用规范化的邮箱", async () => {
		const email = `test_status_case_${Date.now()}@test.local`;
		await subscribeNewsletter(email);

		// 用大写查询
		const status = await checkSubscriptionStatus(email.toUpperCase());

		expect(status.found).toBe(true);
		expect(status.isSubscribed).toBe(true);
	});
});

// ============================================
// 完整流程测试
// ============================================

describe("Newsletter Full Lifecycle", () => {
	it("完整订阅生命周期：订阅 → 取消 → 重新订阅 → 取消", async () => {
		const email = `test_lifecycle_${Date.now()}@test.local`;

		// 1. 首次订阅
		const sub1 = await subscribeNewsletter(email);
		expect(sub1.success).toBe(true);
		expect(sub1.alreadySubscribed).toBeUndefined();

		let status = await checkSubscriptionStatus(email);
		expect(status.isSubscribed).toBe(true);

		// 2. 取消订阅
		const unsub1 = await unsubscribeNewsletter(email);
		expect(unsub1.success).toBe(true);

		status = await checkSubscriptionStatus(email);
		expect(status.isSubscribed).toBe(false);

		// 3. 重新订阅
		const sub2 = await subscribeNewsletter(email);
		expect(sub2.success).toBe(true);
		expect(sub2.reactivated).toBe(true);

		status = await checkSubscriptionStatus(email);
		expect(status.isSubscribed).toBe(true);

		// 4. 再次取消
		const unsub2 = await unsubscribeNewsletter(email);
		expect(unsub2.success).toBe(true);

		status = await checkSubscriptionStatus(email);
		expect(status.isSubscribed).toBe(false);
	});
});
