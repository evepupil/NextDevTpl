import {
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { OperationsSnapshotPayload } from "@/features/operations/types";

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

export type OperationsDailySnapshot =
  typeof operationsDailySnapshot.$inferSelect;
export type NewOperationsDailySnapshot =
  typeof operationsDailySnapshot.$inferInsert;
