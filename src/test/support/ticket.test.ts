/**
 * 工单系统集成测试
 *
 * 测试范围：
 * - 工单 CRUD 操作
 * - 工单消息管理
 * - 工单状态流转
 * - 权限验证（用户只能访问自己的工单）
 */

import { desc, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { ticket, user } from "@/db/schema";
import {
	cleanupTestUsers,
	createTestTicket,
	createTestTicketMessage,
	createTestTicketWithMessage,
	createTestUser,
	getTicketWithMessages,
	getUserTickets,
	testDb,
} from "../utils";

// 收集测试中创建的用户 ID，用于清理
const createdUserIds: string[] = [];

// 测试后清理
afterAll(async () => {
	await cleanupTestUsers(createdUserIds);
});

// ============================================
// 工单创建测试
// ============================================

describe("Ticket Creation", () => {
	it("应该正确创建工单", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({
			userId: testUser.id,
			subject: "测试工单主题",
			category: "technical",
			priority: "high",
		});

		expect(ticketData).toBeDefined();
		expect(ticketData.userId).toBe(testUser.id);
		expect(ticketData.subject).toBe("测试工单主题");
		expect(ticketData.category).toBe("technical");
		expect(ticketData.priority).toBe("high");
		expect(ticketData.status).toBe("open");
	});

	it("应该创建带初始消息的工单", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const { ticket: ticketData, message } = await createTestTicketWithMessage({
			userId: testUser.id,
			subject: "需要技术支持",
			category: "technical",
			priority: "medium",
			message: "我遇到了一个问题...",
		});

		expect(ticketData).toBeDefined();
		expect(message).toBeDefined();
		expect(message.ticketId).toBe(ticketData.id);
		expect(message.content).toBe("我遇到了一个问题...");
		expect(message.isAdminResponse).toBe(false);
	});

	it("应该使用默认值创建工单", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({
			userId: testUser.id,
		});

		expect(ticketData.category).toBe("other");
		expect(ticketData.priority).toBe("medium");
		expect(ticketData.status).toBe("open");
	});
});

// ============================================
// 工单消息测试
// ============================================

describe("Ticket Messages", () => {
	it("应该添加用户消息到工单", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const { ticket: ticketData } = await createTestTicketWithMessage({
			userId: testUser.id,
		});

		// 添加第二条消息
		const newMessage = await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: testUser.id,
			content: "这是追加的消息",
			isAdminResponse: false,
		});

		expect(newMessage.ticketId).toBe(ticketData.id);
		expect(newMessage.content).toBe("这是追加的消息");

		// 验证消息数量
		const { messages } = await getTicketWithMessages(ticketData.id);
		expect(messages).toHaveLength(2);
	});

	it("应该添加管理员回复消息", async () => {
		const testUser = await createTestUser();
		const adminUser = await createTestUser({ role: "admin" });
		createdUserIds.push(testUser.id, adminUser.id);

		const { ticket: ticketData } = await createTestTicketWithMessage({
			userId: testUser.id,
		});

		// 管理员回复
		const adminReply = await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: adminUser.id,
			content: "我来帮您解决这个问题",
			isAdminResponse: true,
		});

		expect(adminReply.isAdminResponse).toBe(true);

		// 验证消息列表
		const { messages } = await getTicketWithMessages(ticketData.id);
		expect(messages).toHaveLength(2);

		const adminMessage = messages.find((m) => m.isAdminResponse);
		expect(adminMessage).toBeDefined();
		expect(adminMessage?.userId).toBe(adminUser.id);
	});

	it("应该按时间顺序返回消息", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({ userId: testUser.id });

		// 按顺序添加多条消息
		await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: testUser.id,
			content: "第一条消息",
		});

		await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: testUser.id,
			content: "第二条消息",
		});

		await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: testUser.id,
			content: "第三条消息",
		});

		const { messages } = await getTicketWithMessages(ticketData.id);
		expect(messages).toHaveLength(3);

		// 验证顺序（按创建时间升序）
		expect(messages[0]!.content).toContain("第一条");
		expect(messages[1]!.content).toContain("第二条");
		expect(messages[2]!.content).toContain("第三条");
	});
});

// ============================================
// 工单状态测试
// ============================================

describe("Ticket Status", () => {
	it("应该更新工单状态为处理中", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({
			userId: testUser.id,
			status: "open",
		});

		// 更新状态
		await testDb
			.update(ticket)
			.set({ status: "in_progress", updatedAt: new Date() })
			.where(eq(ticket.id, ticketData.id));

		// 验证更新
		const { ticket: updated } = await getTicketWithMessages(ticketData.id);
		expect(updated?.status).toBe("in_progress");
	});

	it("应该更新工单状态为已解决", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({
			userId: testUser.id,
			status: "in_progress",
		});

		// 更新状态
		await testDb
			.update(ticket)
			.set({ status: "resolved", updatedAt: new Date() })
			.where(eq(ticket.id, ticketData.id));

		const { ticket: updated } = await getTicketWithMessages(ticketData.id);
		expect(updated?.status).toBe("resolved");
	});

	it("应该更新工单状态为已关闭", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({
			userId: testUser.id,
			status: "resolved",
		});

		// 更新状态
		await testDb
			.update(ticket)
			.set({ status: "closed", updatedAt: new Date() })
			.where(eq(ticket.id, ticketData.id));

		const { ticket: updated } = await getTicketWithMessages(ticketData.id);
		expect(updated?.status).toBe("closed");
	});

	it("应该记录工单更新时间", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const ticketData = await createTestTicket({ userId: testUser.id });
		const originalUpdatedAt = ticketData.updatedAt;

		// 等待一小段时间确保时间戳不同
		await new Promise((resolve) => setTimeout(resolve, 10));

		// 更新状态
		await testDb
			.update(ticket)
			.set({ status: "in_progress", updatedAt: new Date() })
			.where(eq(ticket.id, ticketData.id));

		const { ticket: updated } = await getTicketWithMessages(ticketData.id);
		expect(updated?.updatedAt.getTime()).toBeGreaterThan(
			originalUpdatedAt.getTime()
		);
	});
});

// ============================================
// 工单列表查询测试
// ============================================

describe("Ticket Listing", () => {
	it("应该返回用户的所有工单", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		// 创建多个工单
		await createTestTicket({ userId: testUser.id, subject: "工单 1" });
		await createTestTicket({ userId: testUser.id, subject: "工单 2" });
		await createTestTicket({ userId: testUser.id, subject: "工单 3" });

		const tickets = await getUserTickets(testUser.id);
		expect(tickets).toHaveLength(3);
	});

	it("不应该返回其他用户的工单", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		createdUserIds.push(user1.id, user2.id);

		// 用户1创建工单
		await createTestTicket({ userId: user1.id, subject: "用户1的工单" });

		// 用户2创建工单
		await createTestTicket({ userId: user2.id, subject: "用户2的工单" });

		// 查询用户1的工单
		const user1Tickets = await getUserTickets(user1.id);
		expect(user1Tickets).toHaveLength(1);
		expect(user1Tickets[0]!.subject).toBe("用户1的工单");

		// 查询用户2的工单
		const user2Tickets = await getUserTickets(user2.id);
		expect(user2Tickets).toHaveLength(1);
		expect(user2Tickets[0]!.subject).toBe("用户2的工单");
	});

	it("应该按创建时间排序返回工单", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		await createTestTicket({ userId: testUser.id, subject: "第一个工单" });
		await createTestTicket({ userId: testUser.id, subject: "第二个工单" });
		await createTestTicket({ userId: testUser.id, subject: "第三个工单" });

		const tickets = await getUserTickets(testUser.id);

		// 验证按创建时间升序
		expect(tickets[0]!.subject).toBe("第一个工单");
		expect(tickets[1]!.subject).toBe("第二个工单");
		expect(tickets[2]!.subject).toBe("第三个工单");
	});
});

// ============================================
// 工单详情查询测试
// ============================================

describe("Ticket Detail", () => {
	it("应该返回工单及其所有消息", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const { ticket: ticketData } = await createTestTicketWithMessage({
			userId: testUser.id,
			subject: "详情测试工单",
			message: "初始消息",
		});

		// 添加更多消息
		await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: testUser.id,
			content: "追加消息 1",
		});

		await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: testUser.id,
			content: "追加消息 2",
		});

		const { ticket: detail, messages } = await getTicketWithMessages(
			ticketData.id
		);

		expect(detail).toBeDefined();
		expect(detail?.subject).toBe("详情测试工单");
		expect(messages).toHaveLength(3);
	});

	it("不存在的工单应该返回 undefined", async () => {
		const { ticket: detail } = await getTicketWithMessages("non-existent-id");
		expect(detail).toBeUndefined();
	});
});

// ============================================
// 工单类别和优先级测试
// ============================================

describe("Ticket Categories and Priorities", () => {
	it("应该支持所有类别", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const categories = [
			"billing",
			"technical",
			"bug",
			"feature",
			"other",
		] as const;

		for (const category of categories) {
			const ticketData = await createTestTicket({
				userId: testUser.id,
				category,
			});
			expect(ticketData.category).toBe(category);
		}
	});

	it("应该支持所有优先级", async () => {
		const testUser = await createTestUser();
		createdUserIds.push(testUser.id);

		const priorities = ["low", "medium", "high"] as const;

		for (const priority of priorities) {
			const ticketData = await createTestTicket({
				userId: testUser.id,
				priority,
			});
			expect(ticketData.priority).toBe(priority);
		}
	});
});

// ============================================
// 管理员操作测试
// ============================================

describe("Admin Operations", () => {
	it("管理员应该能查看所有工单", async () => {
		const user1 = await createTestUser();
		const user2 = await createTestUser();
		createdUserIds.push(user1.id, user2.id);

		await createTestTicket({ userId: user1.id });
		await createTestTicket({ userId: user2.id });

		// 管理员查询所有工单
		const allTickets = await testDb
			.select({
				id: ticket.id,
				subject: ticket.subject,
				status: ticket.status,
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
				},
			})
			.from(ticket)
			.leftJoin(user, eq(ticket.userId, user.id))
			.orderBy(desc(ticket.createdAt));

		// 应该至少包含我们创建的两个工单
		expect(allTickets.length).toBeGreaterThanOrEqual(2);
	});

	it("管理员回复应该标记为 isAdminResponse", async () => {
		const testUser = await createTestUser();
		const adminUser = await createTestUser({ role: "admin" });
		createdUserIds.push(testUser.id, adminUser.id);

		const ticketData = await createTestTicket({ userId: testUser.id });

		// 管理员回复
		const adminReply = await createTestTicketMessage({
			ticketId: ticketData.id,
			userId: adminUser.id,
			content: "管理员回复内容",
			isAdminResponse: true,
		});

		expect(adminReply.isAdminResponse).toBe(true);
	});
});
