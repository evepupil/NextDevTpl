import { z } from "zod";

/**
 * 工单类别选项
 */
export const ticketCategories = [
  { value: "billing", label: "categories.billing" },
  { value: "technical", label: "categories.technical" },
  { value: "bug", label: "categories.bug" },
  { value: "feature", label: "categories.feature" },
  { value: "other", label: "categories.other" },
] as const;

/**
 * 工单优先级选项
 */
export const ticketPriorities = [
  { value: "low", label: "priorities.low", color: "bg-success" },
  { value: "medium", label: "priorities.medium", color: "bg-warning" },
  { value: "high", label: "priorities.high", color: "bg-destructive" },
] as const;

/**
 * 工单状态选项
 */
export const ticketStatuses = [
  { value: "open", label: "statuses.open", color: "bg-primary" },
  {
    value: "in_progress",
    label: "statuses.in_progress",
    color: "bg-warning",
  },
  { value: "resolved", label: "statuses.resolved", color: "bg-success" },
  {
    value: "closed",
    label: "statuses.closed",
    color: "bg-muted-foreground",
  },
] as const;

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
  category: z.enum(["billing", "technical", "bug", "feature", "other"]),
  /** 优先级 */
  priority: z.enum(["low", "medium", "high"]).default("medium"),
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
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

/**
 * 类型导出
 */
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof addTicketMessageSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
