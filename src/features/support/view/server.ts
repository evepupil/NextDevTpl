import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { ticket, ticketMessage } from "@/db/schema/support";

import type {
  SupportDetailViewProps,
  SupportListViewProps,
  SupportTicketMessage,
  SupportTicketSummary,
} from "./contracts";

export async function getSupportListViewData(
  userId: string,
  locale: string
): Promise<SupportListViewProps> {
  const rows = await db
    .select({
      category: ticket.category,
      createdAt: ticket.createdAt,
      id: ticket.id,
      priority: ticket.priority,
      status: ticket.status,
      subject: ticket.subject,
    })
    .from(ticket)
    .where(eq(ticket.userId, userId))
    .orderBy(desc(ticket.createdAt));

  return {
    locale,
    tickets: rows.map(toTicketSummary),
  };
}

export async function getSupportDetailViewData(input: {
  locale: string;
  ticketId: string;
  userId: string;
}): Promise<SupportDetailViewProps | null> {
  const [row] = await db
    .select({
      category: ticket.category,
      createdAt: ticket.createdAt,
      id: ticket.id,
      priority: ticket.priority,
      status: ticket.status,
      subject: ticket.subject,
    })
    .from(ticket)
    .where(and(eq(ticket.id, input.ticketId), eq(ticket.userId, input.userId)))
    .limit(1);

  if (!row) return null;

  const messageRows = await db
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
    .where(eq(ticketMessage.ticketId, input.ticketId))
    .orderBy(ticketMessage.createdAt);

  return {
    currentUserId: input.userId,
    locale: input.locale,
    messages: messageRows.map(toTicketMessage),
    ticket: toTicketSummary(row),
  };
}

function toTicketSummary(row: {
  category: string;
  createdAt: Date;
  id: string;
  priority: string;
  status: string;
  subject: string;
}): SupportTicketSummary {
  return {
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
  };
}

function toTicketMessage(row: {
  id: string;
  content: string;
  isAdminResponse: boolean;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null } | null;
}): SupportTicketMessage {
  return {
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    isAdminResponse: row.isAdminResponse,
    user: row.user,
  };
}
