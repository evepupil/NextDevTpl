import { z } from "zod";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/core/support/contracts";

const categoryLabels: Record<TicketCategory, string> = {
  billing: "categories.billing",
  technical: "categories.technical",
  bug: "categories.bug",
  feature: "categories.feature",
  other: "categories.other",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "priorities.low",
  medium: "priorities.medium",
  high: "priorities.high",
};

const priorityColors: Record<TicketPriority, string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "statuses.open",
  in_progress: "statuses.in_progress",
  resolved: "statuses.resolved",
  closed: "statuses.closed",
};

const statusColors: Record<TicketStatus, string> = {
  open: "bg-primary",
  in_progress: "bg-warning",
  resolved: "bg-success",
  closed: "bg-muted-foreground",
};

/**
 * 工单类别选项
 */
export const ticketCategories = TICKET_CATEGORIES.map((value) => ({
  value,
  label: categoryLabels[value],
}));

/**
 * 工单优先级选项
 */
export const ticketPriorities = TICKET_PRIORITIES.map((value) => ({
  value,
  label: priorityLabels[value],
  color: priorityColors[value],
}));

/**
 * 工单状态选项
 */
export const ticketStatuses = TICKET_STATUSES.map((value) => ({
  value,
  label: statusLabels[value],
  color: statusColors[value],
}));

/**
 * 创建工单 Schema
 */
export const createTicketSchema = z.object({
  /** 工单主题 */
  subject: z
    .string()
    .min(5, "主题至少需要5个字符")
    .max(200, "主题最多200个字符"),
  /** 工单类别 */
  category: z.enum(TICKET_CATEGORIES),
  /** 优先级 */
  priority: z.enum(TICKET_PRIORITIES).default("medium"),
  /** 初始消息内容 */
  message: z
    .string()
    .min(10, "消息内容至少需要10个字符")
    .max(5000, "消息内容最多5000个字符"),
});

/**
 * 添加工单消息 Schema
 */
export const addTicketMessageSchema = z.object({
  /** 工单 ID */
  ticketId: z.string().min(1, "工单ID不能为空"),
  /** 消息内容 */
  content: z
    .string()
    .min(1, "消息内容不能为空")
    .max(5000, "消息内容最多5000个字符"),
});

/**
 * 更新工单状态 Schema (管理员)
 */
export const updateTicketStatusSchema = z.object({
  /** 工单 ID */
  ticketId: z.string().min(1, "工单ID不能为空"),
  /** 新状态 */
  status: z.enum(TICKET_STATUSES),
});

/**
 * 类型导出
 */
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
