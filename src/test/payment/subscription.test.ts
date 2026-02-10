/**
 * 支付系统集成测试
 *
 * 测试范围：
 * - 订阅 CRUD 操作
 * - 订阅状态查询
 * - 用户订阅状态检查
 * - Customer ID 管理
 */

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { subscription, user } from "@/db/schema";
import {
	cleanupTestUsers,
	createTestSubscription,
	createTestUser,
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
// 订阅创建测试
// ============================================

describe("Subscription Creation", () => {
	it("应该正确创建订阅", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			priceId: "price_monthly_pro",
			status: "active",
		});

		expect(sub).toBeDefined();
		expect(sub.userId).toBe(testUser.id);
		expect(sub.priceId).toBe("price_monthly_pro");
		expect(sub.status).toBe("active");
		expect(sub.cancelAtPeriodEnd).toBe(false);
	});

	it("应该创建试用期订阅", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "trialing",
		});

		expect(sub.status).toBe("trialing");
	});

	it("应该创建已取消的订阅", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "canceled",
			cancelAtPeriodEnd: true,
		});

		expect(sub.status).toBe("canceled");
		expect(sub.cancelAtPeriodEnd).toBe(true);
	});

	it("应该设置订阅周期", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const now = new Date();
		const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

		const sub = await createTestSubscription({
			userId: testUser.id,
			currentPeriodStart: now,
			currentPeriodEnd: thirtyDaysLater,
		});

		expect(sub.currentPeriodStart).toBeDefined();
		expect(sub.currentPeriodEnd).toBeDefined();
		expect(sub.currentPeriodEnd!.getTime()).toBeGreaterThan(
			sub.currentPeriodStart!.getTime()
		);
	});
});

// ============================================
// 订阅状态查询测试
// ============================================

describe("Subscription Status Query", () => {
	it("应该返回用户的订阅信息", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await createTestSubscription({
			userId: testUser.id,
			priceId: "price_yearly_pro",
			status: "active",
		});

		const sub = await getUserSubscription(testUser.id);

		expect(sub).toBeDefined();
		expect(sub?.priceId).toBe("price_yearly_pro");
		expect(sub?.status).toBe("active");
	});

	it("没有订阅的用户应该返回 undefined", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await getUserSubscription(testUser.id);

		expect(sub).toBeUndefined();
	});

	it("应该区分活跃和非活跃订阅", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		const user3 = await createTestUser();
		createdUserIds.push(user1.id, user2.id, user3.id);

		// 活跃订阅
		await createTestSubscription({
			userId: user1.id,
			status: "active",
		});

		// 试用期订阅
		await createTestSubscription({
			userId: user2.id,
			status: "trialing",
		});

		// 已取消订阅
		await createTestSubscription({
			userId: user3.id,
			status: "canceled",
		});

		const sub1 = await getUserSubscription(user1.id);
		const sub2 = await getUserSubscription(user2.id);
		const sub3 = await getUserSubscription(user3.id);

		// 模拟 hasActiveSubscription 的逻辑
		const isActive1 = ["active", "trialing", "lifetime"].includes(sub1?.status ?? "");
		const isActive2 = ["active", "trialing", "lifetime"].includes(sub2?.status ?? "");
		const isActive3 = ["active", "trialing", "lifetime"].includes(sub3?.status ?? "");

		expect(isActive1).toBe(true);
		expect(isActive2).toBe(true);
		expect(isActive3).toBe(false);
	});
});

// ============================================
// 订阅更新测试
// ============================================

describe("Subscription Update", () => {
	it("应该更新订阅状态", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "trialing",
		});

		// 从试用期转为正式订阅
		await testDb
			.update(subscription)
			.set({ status: "active", updatedAt: new Date() })
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.status).toBe("active");
	});

	it("应该设置取消标记", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
			cancelAtPeriodEnd: false,
		});

		// 标记为周期结束后取消
		await testDb
			.update(subscription)
			.set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.cancelAtPeriodEnd).toBe(true);
	});

	it("应该更新订阅周期", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		// 延长订阅周期
		const newEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

		await testDb
			.update(subscription)
			.set({
				currentPeriodEnd: newEnd,
				updatedAt: new Date(),
			})
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.currentPeriodEnd?.getTime()).toBe(newEnd.getTime());
	});

	it("应该更新 Price ID（升级/降级计划）", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			priceId: "price_monthly_basic",
		});

		// 升级到 Pro 计划
		await testDb
			.update(subscription)
			.set({
				priceId: "price_monthly_pro",
				updatedAt: new Date(),
			})
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.priceId).toBe("price_monthly_pro");
	});
});

// ============================================
// Customer ID 测试
// ============================================

describe("Customer ID", () => {
	it("应该存储 Customer ID", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const customerId = `cus_test_${Date.now()}`;

		await testDb
			.update(user)
			.set({ customerId })
			.where(eq(user.id, testUser.id));

		const [updated] = await testDb
			.select({ customerId: user.customerId })
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(updated?.customerId).toBe(customerId);
	});

	it("新用户应该没有 Customer ID", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const [dbUser] = await testDb
			.select({ customerId: user.customerId })
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(dbUser?.customerId).toBeNull();
	});

	it("应该更新 Customer ID", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const oldCustomerId = `cus_old_${Date.now()}`;
		const newCustomerId = `cus_new_${Date.now()}`;

		// 设置初始 Customer ID
		await testDb
			.update(user)
			.set({ customerId: oldCustomerId })
			.where(eq(user.id, testUser.id));

		// 更新 Customer ID
		await testDb
			.update(user)
			.set({ customerId: newCustomerId })
			.where(eq(user.id, testUser.id));

		const [updated] = await testDb
			.select({ customerId: user.customerId })
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(updated?.customerId).toBe(newCustomerId);
	});
});

// ============================================
// 订阅状态流转测试
// ============================================

describe("Subscription Status Transitions", () => {
	it("应该支持 incomplete → active 转换", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "incomplete",
		});

		// 支付成功后转为 active
		await testDb
			.update(subscription)
			.set({ status: "active", updatedAt: new Date() })
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.status).toBe("active");
	});

	it("应该支持 trialing → active 转换", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "trialing",
		});

		// 试用期结束后转为 active
		await testDb
			.update(subscription)
			.set({ status: "active", updatedAt: new Date() })
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.status).toBe("active");
	});

	it("应该支持 active → past_due 转换", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		// 支付失败转为 past_due
		await testDb
			.update(subscription)
			.set({ status: "past_due", updatedAt: new Date() })
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.status).toBe("past_due");
	});

	it("应该支持 active → canceled 转换", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
		});

		// 取消订阅
		await testDb
			.update(subscription)
			.set({
				status: "canceled",
				cancelAtPeriodEnd: true,
				updatedAt: new Date(),
			})
			.where(eq(subscription.id, sub.id));

		const updated = await getUserSubscription(testUser.id);
		expect(updated?.status).toBe("canceled");
		expect(updated?.cancelAtPeriodEnd).toBe(true);
	});

	it("应该支持 lifetime 状态", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 一次性购买的终身订阅
		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "lifetime",
		});

		const isActive = ["active", "trialing", "lifetime"].includes(sub.status);
		expect(isActive).toBe(true);
	});
});

// ============================================
// 订阅与用户关联测试
// ============================================

describe("Subscription User Association", () => {
	it("不同用户应该有独立的订阅", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		createdUserIds.push(user1.id, user2.id);

		await createTestSubscription({
			userId: user1.id,
			priceId: "price_basic",
			status: "active",
		});

		await createTestSubscription({
			userId: user2.id,
			priceId: "price_pro",
			status: "trialing",
		});

		const sub1 = await getUserSubscription(user1.id);
		const sub2 = await getUserSubscription(user2.id);

		expect(sub1?.priceId).toBe("price_basic");
		expect(sub1?.status).toBe("active");
		expect(sub2?.priceId).toBe("price_pro");
		expect(sub2?.status).toBe("trialing");
	});

	it("删除用户应该级联删除订阅", async () => {
		const testUser = await createTestUser();
		const userId = testUser.id;

		await createTestSubscription({
			userId,
			status: "active",
		});

		// 验证订阅存在
		let sub = await getUserSubscription(userId);
		expect(sub).toBeDefined();

		// 清理用户（级联删除订阅）
		await cleanupTestUsers([userId]);

		// 验证订阅已删除
		sub = await getUserSubscription(userId);
		expect(sub).toBeUndefined();

		// 不需要再添加到 createdUserIds，已经清理了
	});
});

// ============================================
// 订阅周期验证测试
// ============================================

describe("Subscription Period Validation", () => {
	it("应该检测过期订阅", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 天前

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
			currentPeriodEnd: pastDate,
		});

		const isExpired = sub.currentPeriodEnd!.getTime() < Date.now();
		expect(isExpired).toBe(true);
	});

	it("应该检测有效订阅", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 天后

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
			currentPeriodEnd: futureDate,
		});

		const isValid = sub.currentPeriodEnd!.getTime() > Date.now();
		expect(isValid).toBe(true);
	});

	it("应该计算剩余天数", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const daysRemaining = 15;
		const futureDate = new Date(
			Date.now() + daysRemaining * 24 * 60 * 60 * 1000
		);

		const sub = await createTestSubscription({
			userId: testUser.id,
			status: "active",
			currentPeriodEnd: futureDate,
		});

		const msRemaining = sub.currentPeriodEnd!.getTime() - Date.now();
		const calculatedDays = Math.floor(msRemaining / (24 * 60 * 60 * 1000));

		// 允许 1 天的误差（由于测试执行时间）
		expect(calculatedDays).toBeGreaterThanOrEqual(daysRemaining - 1);
		expect(calculatedDays).toBeLessThanOrEqual(daysRemaining);
	});
});
