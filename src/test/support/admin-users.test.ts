/**
 * 用户管理集成测试
 *
 * 测试范围：
 * - 用户列表查询
 * - 用户角色更新
 * - 用户封禁/解封
 * - 管理员充值积分
 * - 用户详情查询
 */

import { eq, ilike, or } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { creditsBalance, subscription, user } from "@/db/schema";
import { grantCredits } from "@/features/credits/core";
import { CREDITS_EXPIRY_DAYS } from "@/features/credits/config";
import {
	cleanupTestUsers,
	createTestCreditsBalance,
	createTestUser,
	testDb,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 用户列表查询测试
// ============================================

describe("User Listing", () => {
	it("应该返回所有用户", async () => {
		const user1 = await createTestUser({ name: "列表测试用户1" });
		const user2 = await createTestUser({ name: "列表测试用户2" });
		createdUserIds.push(user1.id, user2.id);

		// 查询所有用户
		const users = await testDb
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				banned: user.banned,
			})
			.from(user)
			.orderBy(user.createdAt);

		// 应该至少包含我们创建的两个用户
		expect(users.length).toBeGreaterThanOrEqual(2);

		const testUserIds = users.filter((u) =>
			[user1.id, user2.id].includes(u.id)
		);
		expect(testUserIds).toHaveLength(2);
	});

	it("应该支持按名称搜索", async () => {
		const uniqueName = `搜索测试_${Date.now()}`;
		const testUser = await createTestUser({ name: uniqueName });
		createdUserIds.push(testUser.id);

		// 按名称搜索
		const users = await testDb
			.select({
				id: user.id,
				name: user.name,
			})
			.from(user)
			.where(ilike(user.name, `%${uniqueName}%`));

		expect(users).toHaveLength(1);
		expect(users[0]!.name).toBe(uniqueName);
	});

	it("应该支持按邮箱搜索", async () => {
		const uniqueEmail = `search_test_${Date.now()}@test.local`;
		const testUser = await createTestUser({ email: uniqueEmail });
		createdUserIds.push(testUser.id);

		// 按邮箱搜索
		const users = await testDb
			.select({
				id: user.id,
				email: user.email,
			})
			.from(user)
			.where(ilike(user.email, `%search_test_%`));

		const found = users.find((u) => u.email === uniqueEmail);
		expect(found).toBeDefined();
	});

	it("应该支持组合搜索（名称或邮箱）", async () => {
		const timestamp = Date.now();
		const user1 = await createTestUser({
			name: `组合搜索名称_${timestamp}`,
			email: `other_${timestamp}@test.local`,
		});
		const user2 = await createTestUser({
			name: `其他名称_${timestamp}`,
			email: `combo_search_${timestamp}@test.local`,
		});
		createdUserIds.push(user1.id, user2.id);

		const searchTerm = String(timestamp);

		// 组合搜索
		const users = await testDb
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
			})
			.from(user)
			.where(
				or(ilike(user.name, `%${searchTerm}%`), ilike(user.email, `%${searchTerm}%`))
			);

		const foundIds = users.map((u) => u.id);
		expect(foundIds).toContain(user1.id);
		expect(foundIds).toContain(user2.id);
	});
});

// ============================================
// 用户角色更新测试
// ============================================

describe("User Role Update", () => {
	it("应该更新用户角色为管理员", async () => {
		const testUser = await createTestUser({ role: "user" });
		createdUserIds.push(testUser.id);

		expect(testUser.role).toBe("user");

		// 更新为管理员
		await testDb
			.update(user)
			.set({ role: "admin", updatedAt: new Date() })
			.where(eq(user.id, testUser.id));

		// 验证更新
		const [updated] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(updated?.role).toBe("admin");
	});

	it("应该更新管理员角色为普通用户", async () => {
		const adminUser = await createTestUser({ role: "admin" });
		createdUserIds.push(adminUser.id);

		expect(adminUser.role).toBe("admin");

		// 降级为普通用户
		await testDb
			.update(user)
			.set({ role: "user", updatedAt: new Date() })
			.where(eq(user.id, adminUser.id));

		// 验证更新
		const [updated] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, adminUser.id))
			.limit(1);

		expect(updated?.role).toBe("user");
	});

	it("应该记录角色更新时间", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const originalUpdatedAt = testUser.updatedAt;

		// 等待一小段时间确保时间戳不同
		await new Promise((resolve) => setTimeout(resolve, 10));

		// 更新角色
		await testDb
			.update(user)
			.set({ role: "admin", updatedAt: new Date() })
			.where(eq(user.id, testUser.id));

		const [updated] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(updated?.updatedAt.getTime()).toBeGreaterThan(
			originalUpdatedAt.getTime()
		);
	});
});

// ============================================
// 用户封禁测试
// ============================================

describe("User Ban/Unban", () => {
	it("应该封禁用户", async () => {
		const testUser = await createTestUser({ banned: false });
		createdUserIds.push(testUser.id);

		expect(testUser.banned).toBe(false);

		// 封禁用户
		const banReason = "违反服务条款";
		await testDb
			.update(user)
			.set({
				banned: true,
				bannedReason: banReason,
				updatedAt: new Date(),
			})
			.where(eq(user.id, testUser.id));

		// 验证封禁
		const [banned] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(banned?.banned).toBe(true);
		expect(banned?.bannedReason).toBe(banReason);
	});

	it("应该解封用户", async () => {
		const testUser = await createTestUser({
			banned: true,
		});
		createdUserIds.push(testUser.id);

		// 手动设置封禁原因
		await testDb
			.update(user)
			.set({ bannedReason: "之前的封禁原因" })
			.where(eq(user.id, testUser.id));

		// 解封用户
		await testDb
			.update(user)
			.set({
				banned: false,
				bannedReason: null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, testUser.id));

		// 验证解封
		const [unbanned] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(unbanned?.banned).toBe(false);
		expect(unbanned?.bannedReason).toBeNull();
	});

	it("封禁时应该记录原因", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const reason = "多次发送垃圾信息";

		await testDb
			.update(user)
			.set({
				banned: true,
				bannedReason: reason,
				updatedAt: new Date(),
			})
			.where(eq(user.id, testUser.id));

		const [banned] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(banned?.bannedReason).toBe(reason);
	});

	it("封禁不带原因应该可以", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await testDb
			.update(user)
			.set({
				banned: true,
				bannedReason: null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, testUser.id));

		const [banned] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(banned?.banned).toBe(true);
		expect(banned?.bannedReason).toBeNull();
	});
});

// ============================================
// 管理员充值积分测试
// ============================================

describe("Admin Grant Credits", () => {
	it("应该为用户充值积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建积分账户
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 0,
			totalEarned: 0,
		});

		// 计算过期时间
		const expiresAt = CREDITS_EXPIRY_DAYS
			? new Date(Date.now() + CREDITS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
			: null;

		// 充值积分
		const result = await grantCredits({
			userId: testUser.id,
			amount: 500,
			sourceType: "bonus",
			debitAccount: "ADMIN:test_admin",
			transactionType: "registration_bonus",
			expiresAt,
			sourceRef: `admin_grant_${Date.now()}`,
			description: "管理员充值: 测试充值",
			metadata: {
				grantType: "admin_manual",
				adminId: "test_admin",
				reason: "测试充值",
			},
		});

		expect(result.newBalance).toBe(500);
	});

	it("应该累加积分", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建积分账户，初始余额 100
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 100,
			totalEarned: 100,
		});

		// 充值 200 积分
		const result = await grantCredits({
			userId: testUser.id,
			amount: 200,
			sourceType: "bonus",
			debitAccount: "ADMIN:test_admin",
			transactionType: "registration_bonus",
			sourceRef: `admin_grant_${Date.now()}`,
		});

		expect(result.newBalance).toBe(300);
	});

	it("应该为没有积分账户的用户自动创建账户并充值", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 不创建积分账户，直接充值（grantCredits 会自动创建）
		const result = await grantCredits({
			userId: testUser.id,
			amount: 100,
			sourceType: "bonus",
			debitAccount: "ADMIN:test_admin",
			transactionType: "registration_bonus",
			sourceRef: `admin_grant_${Date.now()}`,
		});

		expect(result.newBalance).toBe(100);

		// 验证账户已创建
		const [balance] = await testDb
			.select()
			.from(creditsBalance)
			.where(eq(creditsBalance.userId, testUser.id))
			.limit(1);

		expect(balance).toBeDefined();
		expect(balance?.balance).toBe(100);
	});
});

// ============================================
// 用户详情查询测试
// ============================================

describe("User Detail Query", () => {
	it("应该返回用户基本信息", async () => {
		const testUser = await createTestUser({
			name: "详情测试用户",
			role: "user",
		});
		createdUserIds.push(testUser.id);

		const [userDetail] = await testDb
			.select()
			.from(user)
			.where(eq(user.id, testUser.id))
			.limit(1);

		expect(userDetail).toBeDefined();
		expect(userDetail?.name).toBe("详情测试用户");
		expect(userDetail?.role).toBe("user");
	});

	it("应该返回用户积分信息", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建积分账户
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 500,
			totalEarned: 1000,
			totalSpent: 500,
		});

		const [balance] = await testDb
			.select()
			.from(creditsBalance)
			.where(eq(creditsBalance.userId, testUser.id))
			.limit(1);

		expect(balance).toBeDefined();
		expect(balance?.balance).toBe(500);
		expect(balance?.totalEarned).toBe(1000);
		expect(balance?.totalSpent).toBe(500);
	});

	it("没有积分账户的用户应该返回 null", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const [balance] = await testDb
			.select()
			.from(creditsBalance)
			.where(eq(creditsBalance.userId, testUser.id))
			.limit(1);

		expect(balance).toBeUndefined();
	});

	it("没有订阅的用户应该返回 null", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const [sub] = await testDb
			.select()
			.from(subscription)
			.where(eq(subscription.userId, testUser.id))
			.limit(1);

		expect(sub).toBeUndefined();
	});
});

// ============================================
// 用户与积分/订阅关联查询测试
// ============================================

describe("User with Credits and Subscription", () => {
	it("应该能关联查询用户和积分信息", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建积分账户
		await createTestCreditsBalance({
			userId: testUser.id,
			balance: 200,
		});

		// 模拟 getAllUsersAction 的查询逻辑
		const users = await testDb
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
			})
			.from(user)
			.where(eq(user.id, testUser.id));

		const balances = await testDb
			.select({
				userId: creditsBalance.userId,
				balance: creditsBalance.balance,
			})
			.from(creditsBalance)
			.where(eq(creditsBalance.userId, testUser.id));

		const balanceMap = new Map(balances.map((b) => [b.userId, b]));

		const usersWithCredits = users.map((u) => ({
			...u,
			credits: balanceMap.get(u.id) || null,
		}));

		expect(usersWithCredits).toHaveLength(1);
		expect(usersWithCredits[0]?.credits?.balance).toBe(200);
	});

	it("应该处理多个用户的批量查询", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		const user3 = await createTestUser();
		createdUserIds.push(user1.id, user2.id, user3.id);

		// 只给 user1 和 user2 创建积分
		await createTestCreditsBalance({ userId: user1.id, balance: 100 });
		await createTestCreditsBalance({ userId: user2.id, balance: 200 });

		// 查询所有测试用户
		const users = await testDb
			.select({ id: user.id, name: user.name })
			.from(user)
			.where(
				or(
					eq(user.id, user1.id),
					eq(user.id, user2.id),
					eq(user.id, user3.id)
				)
			);

		const balances = await testDb
			.select({
				userId: creditsBalance.userId,
				balance: creditsBalance.balance,
			})
			.from(creditsBalance)
			.where(
				or(
					eq(creditsBalance.userId, user1.id),
					eq(creditsBalance.userId, user2.id),
					eq(creditsBalance.userId, user3.id)
				)
			);

		const balanceMap = new Map(balances.map((b) => [b.userId, b]));

		const usersWithCredits = users.map((u) => ({
			...u,
			credits: balanceMap.get(u.id) || null,
		}));

		expect(usersWithCredits).toHaveLength(3);

		const u1 = usersWithCredits.find((u) => u.id === user1.id);
		const u2 = usersWithCredits.find((u) => u.id === user2.id);
		const u3 = usersWithCredits.find((u) => u.id === user3.id);

		expect(u1?.credits?.balance).toBe(100);
		expect(u2?.credits?.balance).toBe(200);
		expect(u3?.credits).toBeNull();
	});
});
