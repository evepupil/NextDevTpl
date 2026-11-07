export const TICKET_CATEGORIES = [
  "billing",
  "technical",
  "bug",
  "feature",
  "other",
] as const;
export const TICKET_PRIORITIES = ["low", "medium", "high"] as const;
export const TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface SupportDetailPageInput {
  readonly ticketId: string;
  readonly locale: string;
}
