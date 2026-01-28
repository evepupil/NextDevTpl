/**
 * 测试工具模块导出
 */

// 数据库工具
export {
	testDb,
	closeTestDb,
	cleanupUserData,
	cleanupTestUsers,
	cleanupTestData,
	checkDbConnection,
	getUserCreditsState,
	getTicketWithMessages,
	getUserTickets,
	getUserSubscription,
	cleanupTestNewsletterSubscribers,
	createTestNewsletterSubscriber,
} from "./db";

// 测试数据工厂
export {
	// ID 生成
	generateTestId,
	resetTestIdCounter,
	// 用户
	createTestUser,
	createTestUsers,
	type CreateTestUserOptions,
	// 积分
	createTestCreditsBatch,
	createTestCreditsBalance,
	createTestUserWithCredits,
	type CreateCreditsBatchOptions,
	type CreateCreditsBalanceOptions,
	type CreateUserWithCreditsOptions,
	// 工单
	createTestTicket,
	createTestTicketMessage,
	createTestTicketWithMessage,
	type CreateTestTicketOptions,
	type CreateTestTicketMessageOptions,
	type CreateTestTicketWithMessageOptions,
	// 订阅
	createTestSubscription,
	type CreateTestSubscriptionOptions,
	// 时间工具
	daysAgo,
	daysFromNow,
	expiredDate,
	soonExpiringDate,
} from "./fixtures";
