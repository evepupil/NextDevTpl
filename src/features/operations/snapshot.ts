import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { operationsDailySnapshot } from "@/db/schema/operations";

import {
  formatOperationsDate,
  getOperationsDashboard,
  getOperationsPeriod,
} from "./repository";
import type { OperationsDashboard } from "./types";

export async function saveOperationsDailySnapshot(
  dashboard: OperationsDashboard
): Promise<void> {
  const date = formatOperationsDate(
    new Date(dashboard.period.start),
    dashboard.period.timezone
  );
  const id = `operations-${date}-${dashboard.period.timezone}`;
  await db
    .insert(operationsDailySnapshot)
    .values({
      id,
      metrics: dashboard,
      snapshotDate: date,
      timezone: dashboard.period.timezone,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        operationsDailySnapshot.snapshotDate,
        operationsDailySnapshot.timezone,
      ],
      set: { metrics: dashboard, updatedAt: new Date() },
    });
}

export async function createOperationsDailySnapshot(
  options: { now?: Date; timezone?: string } = {}
): Promise<OperationsDashboard> {
  const dashboard = await getOperationsDashboard(options);
  await saveOperationsDailySnapshot(dashboard);
  return dashboard;
}

export async function getLatestOperationsSnapshot(
  timezone = "UTC"
): Promise<OperationsDashboard | null> {
  const period = getOperationsPeriod({ timezone });
  const rows = await db
    .select({ metrics: operationsDailySnapshot.metrics })
    .from(operationsDailySnapshot)
    .where(eq(operationsDailySnapshot.timezone, period.timezone))
    .orderBy(desc(operationsDailySnapshot.snapshotDate))
    .limit(1);
  return rows[0]?.metrics ?? null;
}
