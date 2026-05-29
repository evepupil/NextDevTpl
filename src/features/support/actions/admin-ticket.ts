"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { ticket, ticketMessage, user } from "@/db/schema";
import {
  addTicketMessageSchema,
  updateTicketStatusSchema,
} from "@/features/support/schemas";
import { adminAction } from "@/lib/safe-action";

const withAdminTicketAction = (name: string) =>
  adminAction.metadata({ action: `support.admin.${name}` });

/**
 * 获取所有工单列表 (管理员)
 */
export const getAllTicketsAction = withAdminTicketAction(
  "getAllTickets"
).action(async () => {
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
 */
export const getAdminTicketDetailAction = withAdminTicketAction(
  "getAdminTicketDetail"
)
  .schema(addTicketMessageSchema.pick({ ticketId: true }))
  .action(async ({ parsedInput: { ticketId } }) => {
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
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(eq(ticket.id, data.ticketId))
      .limit(1);

    const ticketData = ticketResult[0];
    if (!ticketData) {
      throw new Error("工单不存在");
    }

    await db.insert(ticketMessage).values({
      id: crypto.randomUUID(),
      ticketId: data.ticketId,
      userId: ctx.userId,
      content: data.content,
      isAdminResponse: true,
    });

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

    revalidatePath(`/admin/tickets/${data.ticketId}`);

    return {
      message: "回复成功",
    };
  });

/**
 * 更新工单状态 (管理员)
 */
export const updateTicketStatusAction = withAdminTicketAction(
  "updateTicketStatus"
)
  .schema(updateTicketStatusSchema)
  .action(async ({ parsedInput: data }) => {
    const ticketResult = await db
      .select()
      .from(ticket)
      .where(eq(ticket.id, data.ticketId))
      .limit(1);

    if (ticketResult.length === 0) {
      throw new Error("工单不存在");
    }

    await db
      .update(ticket)
      .set({ status: data.status, updatedAt: new Date() })
      .where(eq(ticket.id, data.ticketId));

    revalidatePath(`/admin/tickets/${data.ticketId}`);
    revalidatePath("/admin/tickets");

    return {
      message: "状态更新成功",
    };
  });
