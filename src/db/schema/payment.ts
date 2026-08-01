import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const paymentWebhookEvent = pgTable("payment_webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("processing"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentWebhookEvent = typeof paymentWebhookEvent.$inferSelect;
export type NewPaymentWebhookEvent = typeof paymentWebhookEvent.$inferInsert;
