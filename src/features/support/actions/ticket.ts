"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { ticket, ticketMessage, user } from "@/db/schema";
import { adminAction, protectedAction } from "@/lib/safe-action";
import {
  createTicketSchema,
  addTicketMessageSchema,
  updateTicketStatusSchema,
} from "@/features/support/schemas";

const withTicketAction = (name: string) =>
  protectedAction.metadata({ action: `support.${name}` });
const withAdminTicketAction = (name: string) =>
  adminAction.metadata({ action: `support.admin.${name}` });

// ============================================
// 用户端 Actions
// ============================================

/**
 * 创建工单
 *
 * 用户创建新的支持工单，同时添加第一条消息
 */
export const createTicketAction = withTicketAction("createTicket")
  .schema(createTicketSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 生成唯一 ID
    const ticketId = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    // 创建工单
    await db.insert(ticket).values({
      id: ticketId,
      userId: ctx.userId,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      status: "open",
    });

    // 创建初始消息
    await db.insert(ticketMessage).values({
      id: messageId,
      ticketId: ticketId,
      userId: ctx.userId,
      content: data.message,
      isAdminResponse: false,
    });

    // 刷新缓存
    revalidatePath("/dashboard/support");

    return {
      message: "工单创建成功",
      ticketId,
    };
  });

/**
 * 获取用户的工单列表
 */
export const getMyTicketsAction = withTicketAction("getMyTickets").action(async ({ ctx }) => {
  const tickets = await db
    .select({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    })
    .from(ticket)
    .where(eq(ticket.userId, ctx.userId))
    .orderBy(desc(ticket.createdAt));

  return { tickets };
});

/**
 * 获取工单详情 (用户端)
 *
 * 只能查看自己的工单
 */
export const getTicketDetailAction = withTicketAction("getTicketDetail")
  .schema(addTicketMessageSchema.pick({ ticketId: true }))
  .action(async ({ parsedInput: { ticketId }, ctx }) => {
    // 获取工单信息
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(and(eq(ticket.id, ticketId), eq(ticket.userId, ctx.userId)))
      .limit(1);

    if (ticketResult.length === 0) {
      throw new Error("工单不存在或无权访问");
    }

    // 获取消息列表
    const messages = await db
      .select({
        id: ticketMessage.id,
        content: ticketMessage.content,
        isAdminResponse: ticketMessage.isAdminResponse,
        createdAt: ticketMessage.createdAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(ticketMessage)
      .leftJoin(user, eq(ticketMessage.userId, user.id))
      .where(eq(ticketMessage.ticketId, ticketId))
      .orderBy(ticketMessage.createdAt);

    return {
      ticket: ticketResult[0],
      messages,
    };
  });

/**
 * 添加工单消息 (用户端)
 */
export const addTicketMessageAction = withTicketAction("addTicketMessage")
  .schema(addTicketMessageSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 验证工单属于当前用户
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(and(eq(ticket.id, data.ticketId), eq(ticket.userId, ctx.userId)))
      .limit(1);

    const ticketData = ticketResult[0];
    if (!ticketData) {
      throw new Error("工单不存在或无权访问");
    }

    // 检查工单状态
    if (ticketData.status === "closed") {
      throw new Error("工单已关闭，无法添加新消息");
    }

    // 添加消息
    await db.insert(ticketMessage).values({
      id: crypto.randomUUID(),
      ticketId: data.ticketId,
      userId: ctx.userId,
      content: data.content,
      isAdminResponse: false,
    });

    // 更新工单时间
    await db
      .update(ticket)
      .set({ updatedAt: new Date() })
      .where(eq(ticket.id, data.ticketId));

    // 刷新缓存
    revalidatePath(`/dashboard/support/${data.ticketId}`);

    return {
      message: "消息发送成功",
    };
  });

// ============================================
// 管理员 Actions
// ============================================

/**
 * 获取所有工单列表 (管理员)
 */
export const getAllTicketsAction = withAdminTicketAction("getAllTickets").action(async () => {
  const tickets = await db
    .select({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(ticket)
    .leftJoin(user, eq(ticket.userId, user.id))
    .orderBy(desc(ticket.createdAt));

  return { tickets };
});

/**
 * 获取工单详情 (管理员)
 *
 * 管理员可以查看任何工单
 */
export const getAdminTicketDetailAction = withAdminTicketAction("getAdminTicketDetail")
  .schema(addTicketMessageSchema.pick({ ticketId: true }))
  .action(async ({ parsedInput: { ticketId } }) => {
    // 获取工单信息（包含用户信息）
    const ticketResult = await db
      .select({
        ticket: ticket,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(ticket)
      .leftJoin(user, eq(ticket.userId, user.id))
      .where(eq(ticket.id, ticketId))
      .limit(1);

    const result = ticketResult[0];
    if (!result) {
      throw new Error("工单不存在");
    }

    // 获取消息列表
    const messages = await db
      .select({
        id: ticketMessage.id,
        content: ticketMessage.content,
        isAdminResponse: ticketMessage.isAdminResponse,
        createdAt: ticketMessage.createdAt,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(ticketMessage)
      .leftJoin(user, eq(ticketMessage.userId, user.id))
      .where(eq(ticketMessage.ticketId, ticketId))
      .orderBy(ticketMessage.createdAt);

    return {
      ticket: result.ticket,
      ticketUser: result.user,
      messages,
    };
  });

/**
 * 管理员回复工单
 */
export const adminReplyTicketAction = withAdminTicketAction("replyTicket")
  .schema(addTicketMessageSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    // 验证工单存在
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(eq(ticket.id, data.ticketId))
      .limit(1);

    const ticketData = ticketResult[0];
    if (!ticketData) {
      throw new Error("工单不存在");
    }

    // 添加管理员回复
    await db.insert(ticketMessage).values({
      id: crypto.randomUUID(),
      ticketId: data.ticketId,
      userId: ctx.userId,
      content: data.content,
      isAdminResponse: true,
    });

    // 如果工单是 open 状态，自动更新为 in_progress
    if (ticketData.status === "open") {
      await db
        .update(ticket)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(ticket.id, data.ticketId));
    } else {
      await db
        .update(ticket)
        .set({ updatedAt: new Date() })
        .where(eq(ticket.id, data.ticketId));
    }

    // 刷新缓存
    revalidatePath(`/admin/tickets/${data.ticketId}`);

    return {
      message: "回复成功",
    };
  });

/**
 * 更新工单状态 (管理员)
 */
export const updateTicketStatusAction = withAdminTicketAction("updateTicketStatus")
  .schema(updateTicketStatusSchema)
  .action(async ({ parsedInput: data }) => {
    // 验证工单存在
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(eq(ticket.id, data.ticketId))
      .limit(1);

    if (ticketResult.length === 0) {
      throw new Error("工单不存在");
    }

    // 更新状态
    await db
      .update(ticket)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(ticket.id, data.ticketId));

    // 刷新缓存
    revalidatePath(`/admin/tickets/${data.ticketId}`);
    revalidatePath("/admin/tickets");

    return {
      message: "状态更新成功",
    };
  });
