import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const paymentWebhookEvent = pgTable("payment_webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("processing"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const revenueEvent = pgTable(
  "revenue_event",
  {
    id: text("id").primaryKey(),
    externalEventId: text("external_event_id").notNull(),
    provider: text("provider").notNull(),
    kind: text("kind").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    subscriptionId: text("subscription_id"),
    priceId: text("price_id"),
    currency: text("currency").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    interval: text("interval"),
    occurredAt: timestamp("occurred_at").notNull(),
    metadata: jsonb("metadata").$type<Record<string, string>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("revenue_event_external_kind_unique").on(
      table.externalEventId,
      table.kind
    ),
  ]
);

export type PaymentWebhookEvent = typeof paymentWebhookEvent.$inferSelect;
export type NewPaymentWebhookEvent = typeof paymentWebhookEvent.$inferInsert;
export type RevenueEvent = typeof revenueEvent.$inferSelect;
export type NewRevenueEvent = typeof revenueEvent.$inferInsert;
