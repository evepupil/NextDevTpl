import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const subscription = pgTable(
  "subscription",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").notNull().unique(),
    priceId: text("price_id").notNull(),
    pendingPriceId: text("pending_price_id"),
    pendingPriceEffectiveAt: timestamp("pending_price_effective_at"),
    status: text("status").notNull().default("incomplete"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("subscription_user_id_unique").on(table.userId)]
);

export const subscriptionHistory = pgTable(
  "subscription_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id").notNull(),
    eventType: text("event_type").notNull(),
    fromPriceId: text("from_price_id"),
    toPriceId: text("to_price_id"),
    effectiveAt: timestamp("effective_at").notNull(),
    sourceEventId: text("source_event_id"),
    metadata: jsonb("metadata").$type<Record<string, string>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("subscription_history_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
    index("subscription_history_subscription_idx").on(table.subscriptionId),
    uniqueIndex("subscription_history_source_event_unique").on(
      table.sourceEventId
    ),
  ]
);

export const subscriptionCheckout = pgTable(
  "subscription_checkout",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    priceId: text("price_id").notNull(),
    status: text("status").notNull().default("idle"),
    checkoutId: text("checkout_id"),
    checkoutUrl: text("checkout_url"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("subscription_checkout_user_unique").on(table.userId),
    uniqueIndex("subscription_checkout_request_unique").on(table.requestId),
    uniqueIndex("subscription_checkout_checkout_unique").on(table.checkoutId),
    index("subscription_checkout_expires_idx").on(table.expiresAt),
  ]
);

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
export type NewSubscriptionHistory = typeof subscriptionHistory.$inferInsert;
export type SubscriptionCheckout = typeof subscriptionCheckout.$inferSelect;
export type NewSubscriptionCheckout = typeof subscriptionCheckout.$inferInsert;
