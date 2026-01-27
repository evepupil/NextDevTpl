/**
 * 测试数据工厂 (Fixtures)
 *
 * 提供创建测试数据的工厂函数
 */

import { testDb } from "./db";
import * as schema from "@/db/schema";

// ============================================
// ID 生成
// ============================================

let testIdCounter = 0;

/**
 * 生成唯一的测试 ID
 */
export function generateTestId(prefix = "test"): string {
	testIdCounter++;
	return `${prefix}_${Date.now()}_${testIdCounter}`;
}

/**
 * 重置测试 ID 计数器（在测试套件开始时调用）
 */
export function resetTestIdCounter() {
	testIdCounter = 0;
}

// ============================================
// 用户工厂
// ============================================

export interface CreateTestUserOptions {
	id?: string;
	name?: string;
	email?: string;
	emailVerified?: boolean;
	role?: "user" | "admin";
	banned?: boolean;
}

/**
 * 创建测试用户
 */
export async function createTestUser(
	options: CreateTestUserOptions = {}
): Promise<schema.User> {
	const id = options.id ?? generateTestId("test_user");
	const timestamp = Date.now();

	const userData: schema.NewUser = {
		id,
		name: options.name ?? `Test User ${timestamp}`,
		email: options.email ?? `test_${timestamp}@test.local`,
		emailVerified: options.emailVerified ?? true,
		role: options.role ?? "user",
		banned: options.banned ?? false,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const [user] = await testDb.insert(schema.user).values(userData).returning();

	if (!user) {
		throw new Error("创建测试用户失败");
	}

	return user;
}

/**
 * 批量创建测试用户
 */
export async function createTestUsers(
	count: number,
	options: Omit<CreateTestUserOptions, "id" | "email"> = {}
): Promise<schema.User[]> {
	const users: schema.User[] = [];

	for (let i = 0; i < count; i++) {
		const userOptions: CreateTestUserOptions = { ...options };
		if (options.name) {
			userOptions.name = `${options.name} ${i + 1}`;
		}
		const user = await createTestUser(userOptions);
		users.push(user);
	}

	return users;
}

// ============================================
// 积分工厂
// ============================================

export interface CreateCreditsBatchOptions {
	userId: string;
	amount?: number;
	remaining?: number;
	sourceType?: schema.CreditsBatchSource;
	status?: schema.CreditsBatchStatus;
	expiresAt?: Date | null;
	sourceRef?: string;
}

/**
 * 直接创建积分批次（绕过业务逻辑，用于测试特定场景）
 */
export async function createTestCreditsBatch(
	options: CreateCreditsBatchOptions
): Promise<schema.CreditsBatch> {
	const id = generateTestId("test_batch");
	const amount = options.amount ?? 100;

	const batchData: schema.NewCreditsBatch = {
		id,
		userId: options.userId,
		amount,
		remaining: options.remaining ?? amount,
		issuedAt: new Date(),
		expiresAt: options.expiresAt ?? null,
		status: options.status ?? "active",
		sourceType: options.sourceType ?? "bonus",
		sourceRef: options.sourceRef,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const [batch] = await testDb
		.insert(schema.creditsBatch)
		.values(batchData)
		.returning();

	if (!batch) {
		throw new Error("创建测试积分批次失败");
	}

	return batch;
}

export interface CreateCreditsBalanceOptions {
	userId: string;
	balance?: number;
	totalEarned?: number;
	totalSpent?: number;
	status?: schema.CreditsBalanceStatus;
}

/**
 * 直接创建积分账户（绕过业务逻辑，用于测试特定场景）
 */
export async function createTestCreditsBalance(
	options: CreateCreditsBalanceOptions
): Promise<schema.CreditsBalance> {
	const id = generateTestId("test_balance");

	const balanceData: schema.NewCreditsBalance = {
		id,
		userId: options.userId,
		balance: options.balance ?? 0,
		totalEarned: options.totalEarned ?? 0,
		totalSpent: options.totalSpent ?? 0,
		status: options.status ?? "active",
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const [balance] = await testDb
		.insert(schema.creditsBalance)
		.values(balanceData)
		.returning();

	if (!balance) {
		throw new Error("创建测试积分账户失败");
	}

	return balance;
}

// ============================================
// 复合工厂
// ============================================

export interface CreateUserWithCreditsOptions extends CreateTestUserOptions {
	initialCredits?: number;
	creditBatches?: Array<{
		amount: number;
		expiresAt?: Date | null;
	}>;
}

/**
 * 创建带有积分的测试用户
 */
export async function createTestUserWithCredits(
	options: CreateUserWithCreditsOptions = {}
): Promise<{
	user: schema.User;
	balance: schema.CreditsBalance;
	batches: schema.CreditsBatch[];
}> {
	const user = await createTestUser(options);

	const batches: schema.CreditsBatch[] = [];
	let totalCredits = 0;

	if (options.creditBatches) {
		for (const batchConfig of options.creditBatches) {
			const batchOptions: CreateCreditsBatchOptions = {
				userId: user.id,
				amount: batchConfig.amount,
			};
			if (batchConfig.expiresAt !== undefined) {
				batchOptions.expiresAt = batchConfig.expiresAt;
			}
			const batch = await createTestCreditsBatch(batchOptions);
			batches.push(batch);
			totalCredits += batchConfig.amount;
		}
	} else if (options.initialCredits) {
		const batch = await createTestCreditsBatch({
			userId: user.id,
			amount: options.initialCredits,
		});
		batches.push(batch);
		totalCredits = options.initialCredits;
	}

	const balance = await createTestCreditsBalance({
		userId: user.id,
		balance: totalCredits,
		totalEarned: totalCredits,
	});

	return { user, balance, batches };
}

// ============================================
// 时间工具
// ============================================

/**
 * 创建过去的日期
 */
export function daysAgo(days: number): Date {
	return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * 创建未来的日期
 */
export function daysFromNow(days: number): Date {
	return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * 创建过期的日期（1天前）
 */
export function expiredDate(): Date {
	return daysAgo(1);
}

/**
 * 创建即将过期的日期（1天后）
 */
export function soonExpiringDate(): Date {
	return daysFromNow(1);
}
