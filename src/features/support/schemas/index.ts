// 工单 Schema 模块导出
export {
  // Schema
  createTicketSchema,
  addTicketMessageSchema,
  updateTicketStatusSchema,
  // 类型
  type CreateTicketInput,
  type AddTicketMessageInput,
  type UpdateTicketStatusInput,
  // 选项配置
  ticketCategories,
  ticketPriorities,
  ticketStatuses,
} from "./ticket";
