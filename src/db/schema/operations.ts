import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { OperationsSnapshotPayload } from "@/features/operations/types";
import { user } from "./auth";

export const operationsDailySnapshot = pgTable(
  "operations_daily_snapshot",
  {
    id: text("id").primaryKey(),
    snapshotDate: date("snapshot_date").notNull(),
    timezone: text("timezone").notNull(),
    metrics: jsonb("metrics").$type<OperationsSnapshotPayload>().notNull(),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("operations_daily_snapshot_date_unique").on(
      table.snapshotDate,
      table.timezone
    ),
  ]
);

export const aiUsageEvent = pgTable("ai_usage_event", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  feature: text("feature").notNull().default("unknown"),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
  usageStatus: text("usage_status").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  creditsConsumed: integer("credits_consumed"),
  success: boolean("success").notNull().default(true),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const operationsAlert = pgTable(
  "operations_alert",
  {
    id: text("id").primaryKey(),
    ruleKey: text("rule_key").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    status: text("status").notNull(),
    severity: text("severity").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    source: text("source").notNull(),
    value: integer("value").notNull(),
    threshold: integer("threshold").notNull(),
    consecutiveCount: integer("consecutive_count").notNull().default(0),
    firstSeenAt: timestamp("first_seen_at").notNull(),
    lastSeenAt: timestamp("last_seen_at").notNull(),
    resolvedAt: timestamp("resolved_at"),
    cooldownUntil: timestamp("cooldown_until"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("operations_alert_dedupe_unique").on(table.dedupeKey)]
);

export const operationsAlertDelivery = pgTable("operations_alert_delivery", {
  id: text("id").primaryKey(),
  alertId: text("alert_id")
    .notNull()
    .references(() => operationsAlert.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OperationsDailySnapshot =
  typeof operationsDailySnapshot.$inferSelect;
export type NewOperationsDailySnapshot =
  typeof operationsDailySnapshot.$inferInsert;
export type AIUsageEvent = typeof aiUsageEvent.$inferSelect;
export type NewAIUsageEvent = typeof aiUsageEvent.$inferInsert;
export type OperationsAlert = typeof operationsAlert.$inferSelect;
export type NewOperationsAlert = typeof operationsAlert.$inferInsert;
export type OperationsAlertDelivery =
  typeof operationsAlertDelivery.$inferSelect;
export type NewOperationsAlertDelivery =
  typeof operationsAlertDelivery.$inferInsert;
