/**
 * 测试数据库工具
 *
 * 提供测试数据库连接、清理和辅助函数
 * 使用 @neondatabase/serverless 的 WebSocket 模式以支持事务
 */

import { neonConfig, Pool } from "@neondatabase/serverless";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/db/schema";

// 配置 WebSocket 以支持事务
neonConfig.webSocketConstructor = ws;

// ============================================
// 数据库连接
// ============================================

let pool: Pool | null = null;

/**
 * 获取测试数据库连接字符串
 */
function getTestDatabaseUrl(): string {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error(
			"DATABASE_URL 环境变量未设置。\n" +
				"请创建 .env.test 文件并添加:\n" +
				"DATABASE_URL=postgresql://...(你的 Neon test branch 连接字符串)"
		);
	}
	return url;
}

/**
 * 创建测试数据库实例
 * 使用 neon-serverless 驱动 (WebSocket) 以支持事务
 */
function createTestDb() {
	const databaseUrl = getTestDatabaseUrl();
	pool = new Pool({ connectionString: databaseUrl });
	return drizzle(pool, { schema });
}

/**
 * 测试数据库实例
 */
export const testDb = createTestDb();

/**
 * 关闭测试数据库连接
 */
export async function closeTestDb() {
	if (pool) {
		await pool.end();
		pool = null;
	}
}

// ============================================
// 数据清理
// ============================================

/**
 * 清理指定用户的所有测试数据
 */
export async function cleanupUserData(userId: string) {
	// 按外键依赖顺序删除
	await testDb
		.delete(schema.creditsTransaction)
		.where(eq(schema.creditsTransaction.userId, userId));

	await testDb
		.delete(schema.creditsBatch)
		.where(eq(schema.creditsBatch.userId, userId));

	await testDb
		.delete(schema.creditsBalance)
		.where(eq(schema.creditsBalance.userId, userId));

	// 删除用户相关的 session 和 account
	await testDb
		.delete(schema.session)
		.where(eq(schema.session.userId, userId));

	await testDb
		.delete(schema.account)
		.where(eq(schema.account.userId, userId));

	// 最后删除用户
	await testDb.delete(schema.user).where(eq(schema.user.id, userId));
}

/**
 * 批量清理测试用户数据
 */
export async function cleanupTestUsers(userIds: string[]) {
	if (userIds.length === 0) return;

	// 按外键依赖顺序删除

	// 1. 清理工单消息（依赖 ticket 和 user）
	await testDb
		.delete(schema.ticketMessage)
		.where(inArray(schema.ticketMessage.userId, userIds));

	// 2. 清理工单（依赖 user）
	await testDb
		.delete(schema.ticket)
		.where(inArray(schema.ticket.userId, userIds));

	// 3. 清理积分相关
	await testDb
		.delete(schema.creditsTransaction)
		.where(inArray(schema.creditsTransaction.userId, userIds));

	await testDb
		.delete(schema.creditsBatch)
		.where(inArray(schema.creditsBatch.userId, userIds));

	await testDb
		.delete(schema.creditsBalance)
		.where(inArray(schema.creditsBalance.userId, userIds));

	// 4. 清理订阅
	await testDb
		.delete(schema.subscription)
		.where(inArray(schema.subscription.userId, userIds));

	// 5. 清理认证相关
	await testDb
		.delete(schema.session)
		.where(inArray(schema.session.userId, userIds));

	await testDb
		.delete(schema.account)
		.where(inArray(schema.account.userId, userIds));

	// 6. 最后删除用户
	await testDb.delete(schema.user).where(inArray(schema.user.id, userIds));
}

/**
 * 清理所有测试数据（危险操作，仅用于测试）
 *
 * 只清理带有 test_ 前缀的数据
 */
export async function cleanupTestData() {
	// 只清理测试用户（以 test_ 开头的）
	const testUsers = await testDb
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(sql`${schema.user.id} LIKE 'test_%'`);

	const userIds = testUsers.map((u) => u.id);
	await cleanupTestUsers(userIds);
}

// ============================================
// 数据库状态检查
// ============================================

/**
 * 检查数据库连接是否正常
 */
export async function checkDbConnection(): Promise<boolean> {
	try {
		await testDb.execute(sql`SELECT 1`);
		return true;
	} catch {
		return false;
	}
}

/**
 * 获取用户的积分账户状态
 */
export async function getUserCreditsState(userId: string) {
	const [balance] = await testDb
		.select()
		.from(schema.creditsBalance)
		.where(eq(schema.creditsBalance.userId, userId))
		.limit(1);

	const batches = await testDb
		.select()
		.from(schema.creditsBatch)
		.where(eq(schema.creditsBatch.userId, userId));

	const transactions = await testDb
		.select()
		.from(schema.creditsTransaction)
		.where(eq(schema.creditsTransaction.userId, userId));

	return { balance, batches, transactions };
}

/**
 * 获取工单及其消息
 */
export async function getTicketWithMessages(ticketId: string) {
	const [ticketData] = await testDb
		.select()
		.from(schema.ticket)
		.where(eq(schema.ticket.id, ticketId))
		.limit(1);

	const messages = await testDb
		.select()
		.from(schema.ticketMessage)
		.where(eq(schema.ticketMessage.ticketId, ticketId))
		.orderBy(schema.ticketMessage.createdAt);

	return { ticket: ticketData, messages };
}

/**
 * 获取用户的所有工单
 */
export async function getUserTickets(userId: string) {
	return await testDb
		.select()
		.from(schema.ticket)
		.where(eq(schema.ticket.userId, userId))
		.orderBy(schema.ticket.createdAt);
}

/**
 * 获取用户的订阅信息
 */
export async function getUserSubscription(userId: string) {
	const [sub] = await testDb
		.select()
		.from(schema.subscription)
		.where(eq(schema.subscription.userId, userId))
		.limit(1);

	return sub;
}

/**
 * 清理测试 Newsletter 订阅者
 */
export async function cleanupTestNewsletterSubscribers(emails: string[]) {
	if (emails.length === 0) return;

	for (const email of emails) {
		await testDb
			.delete(schema.newsletterSubscriber)
			.where(eq(schema.newsletterSubscriber.email, email.toLowerCase()));
	}
}

/**
 * 创建测试 Newsletter 订阅者
 */
export async function createTestNewsletterSubscriber(options: {
	email: string;
	isSubscribed?: boolean;
}): Promise<schema.NewsletterSubscriber> {
	const id = `test_newsletter_${Date.now()}`;
	const normalizedEmail = options.email.toLowerCase().trim();

	const data: schema.NewNewsletterSubscriber = {
		id,
		email: normalizedEmail,
		isSubscribed: options.isSubscribed ?? true,
	};

	const [subscriber] = await testDb
		.insert(schema.newsletterSubscriber)
		.values(data)
		.returning();

	if (!subscriber) {
		throw new Error("创建测试 Newsletter 订阅者失败");
	}

	return subscriber;
}
