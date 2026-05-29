"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { ticket, ticketMessage, user } from "@/db/schema";
import {
  addTicketMessageSchema,
  createTicketSchema,
} from "@/features/support/schemas";
import { protectedAction } from "@/lib/safe-action";

const withTicketAction = (name: string) =>
  protectedAction.metadata({ action: `support.${name}` });

/**
 * 创建工单
 */
export const createTicketAction = withTicketAction("createTicket")
  .schema(createTicketSchema)
  .action(async ({ parsedInput: data, ctx }) => {
    const ticketId = crypto.randomUUID();
    const messageId = crypto.randomUUID();

    await db.insert(ticket).values({
      id: ticketId,
      userId: ctx.userId,
      subject: data.subject,
      category: data.category,
      priority: data.priority,
      status: "open",
    });

    await db.insert(ticketMessage).values({
      id: messageId,
      ticketId: ticketId,
      userId: ctx.userId,
      content: data.message,
      isAdminResponse: false,
    });

    revalidatePath("/dashboard/support");

    return {
      message: "工单创建成功",
      ticketId,
    };
  });

/**
 * 获取用户的工单列表
 */
export const getMyTicketsAction = withTicketAction("getMyTickets").action(
  async ({ ctx }) => {
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
  }
);

/**
 * 获取工单详情 (用户端)
 */
export const getTicketDetailAction = withTicketAction("getTicketDetail")
  .schema(addTicketMessageSchema.pick({ ticketId: true }))
  .action(async ({ parsedInput: { ticketId }, ctx }) => {
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(and(eq(ticket.id, ticketId), eq(ticket.userId, ctx.userId)))
      .limit(1);

    if (ticketResult.length === 0) {
      throw new Error("工单不存在或无权访问");
    }

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
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(and(eq(ticket.id, data.ticketId), eq(ticket.userId, ctx.userId)))
      .limit(1);

    const ticketData = ticketResult[0];
    if (!ticketData) {
      throw new Error("工单不存在或无权访问");
    }

    if (ticketData.status === "closed") {
      throw new Error("工单已关闭，无法添加新消息");
    }

    await db.insert(ticketMessage).values({
      id: crypto.randomUUID(),
      ticketId: data.ticketId,
      userId: ctx.userId,
      content: data.content,
      isAdminResponse: false,
    });

    await db
      .update(ticket)
      .set({ updatedAt: new Date() })
      .where(eq(ticket.id, data.ticketId));

    revalidatePath(`/dashboard/support/${data.ticketId}`);

    return {
      message: "消息发送成功",
    };
  });
