// 工单 Schema 模块导出
export {
  type AddTicketMessageInput,
  addTicketMessageSchema,
  // 类型
  type CreateTicketInput,
  // Schema
  createTicketSchema,
  // 选项配置
  ticketCategories,
  ticketPriorities,
  ticketStatuses,
  type UpdateTicketStatusInput,
  updateTicketStatusSchema,
} from "./ticket";
