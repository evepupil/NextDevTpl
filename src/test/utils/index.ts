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
} from "./db";

// 测试数据工厂
export {
	generateTestId,
	resetTestIdCounter,
	createTestUser,
	createTestUsers,
	createTestCreditsBatch,
	createTestCreditsBalance,
	createTestUserWithCredits,
	daysAgo,
	daysFromNow,
	expiredDate,
	soonExpiringDate,
	type CreateTestUserOptions,
	type CreateCreditsBatchOptions,
	type CreateCreditsBalanceOptions,
	type CreateUserWithCreditsOptions,
} from "./fixtures";
