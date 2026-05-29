/**
 * 测试工具模块导出
 */

// 数据库工具
export {
  checkDbConnection,
  cleanupTestData,
  cleanupTestNewsletterSubscribers,
  cleanupTestUsers,
  cleanupUserData,
  closeTestDb,
  createTestNewsletterSubscriber,
  getTicketWithMessages,
  getUserCreditsState,
  getUserSubscription,
  getUserTickets,
  testDb,
} from "./db";

// 测试数据工厂
export {
  type CreateCreditsBalanceOptions,
  type CreateCreditsBatchOptions,
  type CreateTestSubscriptionOptions,
  type CreateTestTicketMessageOptions,
  type CreateTestTicketOptions,
  type CreateTestTicketWithMessageOptions,
  type CreateTestUserOptions,
  type CreateUserWithCreditsOptions,
  createTestCreditsBalance,
  // 积分
  createTestCreditsBatch,
  // 订阅
  createTestSubscription,
  // 工单
  createTestTicket,
  createTestTicketMessage,
  createTestTicketWithMessage,
  // 用户
  createTestUser,
  createTestUsers,
  createTestUserWithCredits,
  // 时间工具
  daysAgo,
  daysFromNow,
  expiredDate,
  // ID 生成
  generateTestId,
  soonExpiringDate,
} from "./fixtures";
