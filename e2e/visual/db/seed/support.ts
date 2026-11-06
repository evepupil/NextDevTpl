/**
 * 种子：客服工单
 *
 * 4 张工单覆盖全部状态（待处理 / 处理中 / 已解决 / 已关闭），分类和优先级各不相同，
 * 创建时间错开在 2026-09-20 ~ 2026-10-13。工单列表按创建时间倒序，所以时间不能重复。
 *
 * VISUAL_TICKET_ID 对应的工单未关闭，带 3 条往来消息：用户提问 -> 客服回复 -> 用户追问。
 * 消息里的数字和积分种子保持一致（Pro 月度发放 8,000，已用 6,920，剩 1,080）。
 */

import { ticket, ticketMessage } from "../../../../src/db/schema/index";
import {
  VISUAL_SUPPORT_AGENT,
  VISUAL_TICKET_ID,
  VISUAL_USER,
} from "../../constants";
import { at, type SeedTransaction } from "./types";

type TicketCategory = "billing" | "bug" | "feature" | "other" | "technical";
type TicketPriority = "high" | "low" | "medium";
type TicketStatus = "closed" | "in_progress" | "open" | "resolved";

interface TicketSeed {
  category: TicketCategory;
  createdAt: string;
  id: string;
  messages: ReadonlyArray<{
    content: string;
    createdAt: string;
    fromAgent: boolean;
    id: string;
  }>;
  priority: TicketPriority;
  status: TicketStatus;
  subject: string;
}

const TICKETS: readonly TicketSeed[] = [
  {
    category: "billing",
    createdAt: "2026-10-13T09:12:00.000Z",
    id: VISUAL_TICKET_ID,
    messages: [
      {
        content:
          "Hi, I upgraded from Starter to Pro on August 1st, but my credits are running lower than I expected this month. Could you check how my October credits were granted and used?",
        createdAt: "2026-10-13T09:12:00.000Z",
        fromAgent: false,
        id: "visual_message_open_1",
      },
      {
        content:
          "Hello Alex, thanks for reaching out. I checked your account: the Pro plan grants 8,000 credits every billing period, and your October grant of 8,000 credits arrived on October 1st. 6,920 of them have been used so far, which leaves 1,080 from that grant. Your balance also includes a 1,200 credit pack and the 200 credit welcome bonus.",
        createdAt: "2026-10-13T11:40:00.000Z",
        fromAgent: true,
        id: "visual_message_open_2",
      },
      {
        content:
          "That makes sense, thank you. Can you confirm that the 1,080 credits expire on October 20th, while the credit pack and the welcome bonus stay valid?",
        createdAt: "2026-10-13T14:05:00.000Z",
        fromAgent: false,
        id: "visual_message_open_3",
      },
    ],
    priority: "high",
    status: "open",
    subject: "Question about my October credit balance",
  },
  {
    category: "bug",
    createdAt: "2026-10-05T16:30:00.000Z",
    id: "visual_ticket_in_progress",
    messages: [
      {
        content:
          "When I export a deck to Markdown, tables with more than eight columns are cut off at the right edge. The same deck exports correctly to Anki.",
        createdAt: "2026-10-05T16:30:00.000Z",
        fromAgent: false,
        id: "visual_message_in_progress_1",
      },
      {
        content:
          "Thanks for the report, Alex. We can reproduce the truncation and our engineers are working on a fix. We will update this ticket as soon as it ships.",
        createdAt: "2026-10-06T08:20:00.000Z",
        fromAgent: true,
        id: "visual_message_in_progress_2",
      },
    ],
    priority: "medium",
    status: "in_progress",
    subject: "Markdown export truncates wide tables",
  },
  {
    category: "technical",
    createdAt: "2026-09-28T07:45:00.000Z",
    id: "visual_ticket_resolved",
    messages: [
      {
        content:
          "I cannot sign in on my phone after changing my password on my laptop. The laptop session works fine.",
        createdAt: "2026-09-28T07:45:00.000Z",
        fromAgent: false,
        id: "visual_message_resolved_1",
      },
      {
        content:
          "Changing a password signs out other devices. Signing in again with the new password on your phone fixes it. Please let us know if the problem continues.",
        createdAt: "2026-09-28T09:10:00.000Z",
        fromAgent: true,
        id: "visual_message_resolved_2",
      },
    ],
    priority: "low",
    status: "resolved",
    subject: "Signed out on my phone after a password change",
  },
  {
    category: "feature",
    createdAt: "2026-09-20T12:00:00.000Z",
    id: "visual_ticket_closed",
    messages: [
      {
        content:
          "It would be great to share a deck with classmates through a read-only link.",
        createdAt: "2026-09-20T12:00:00.000Z",
        fromAgent: false,
        id: "visual_message_closed_1",
      },
      {
        content:
          "Thanks for the suggestion. Shared read-only decks are on our roadmap, so we are closing this request to keep the roadmap as the single place to follow progress.",
        createdAt: "2026-09-21T10:30:00.000Z",
        fromAgent: true,
        id: "visual_message_closed_2",
      },
    ],
    priority: "low",
    status: "closed",
    subject: "Share a deck through a read-only link",
  },
];

export async function seedSupport(tx: SeedTransaction): Promise<void> {
  await tx.insert(ticket).values(
    TICKETS.map((item) => {
      const lastMessage = item.messages.at(-1);
      return {
        category: item.category,
        createdAt: at(item.createdAt),
        id: item.id,
        priority: item.priority,
        status: item.status,
        subject: item.subject,
        updatedAt: at(lastMessage?.createdAt ?? item.createdAt),
        userId: VISUAL_USER.id,
      };
    })
  );

  await tx.insert(ticketMessage).values(
    TICKETS.flatMap((item) =>
      item.messages.map((message) => ({
        content: message.content,
        createdAt: at(message.createdAt),
        id: message.id,
        isAdminResponse: message.fromAgent,
        ticketId: item.id,
        userId: message.fromAgent ? VISUAL_SUPPORT_AGENT.id : VISUAL_USER.id,
      }))
    )
  );
}
