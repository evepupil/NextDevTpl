import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  operationsAlert,
  operationsAlertDelivery,
} from "@/db/schema/operations";
import { getRuntimeEnv } from "@/lib/runtime-config";
import { alertService } from "@/services/alerts";

import { getOperationsDashboard } from "../repository";
import {
  getOperationsAlertRules,
  isRuleBreached,
  isRuleRecovered,
} from "./rules";
import { evaluateAlertState } from "./state";

export async function evaluateOperationsAlerts(
  options: { now?: Date; timezone?: string } = {}
) {
  const now = options.now ?? new Date();
  const dashboard = await getOperationsDashboard(options);
  const cooldownMinutes = Number(getRuntimeEnv("ALERT_COOLDOWN_MINUTES") ?? 30);
  const rules = getOperationsAlertRules({
    aiCostThresholdMinor: Number(
      getRuntimeEnv("ALERT_AI_COST_THRESHOLD_MINOR") ?? 1000
    ),
    cooldownMinutes: Number.isFinite(cooldownMinutes) ? cooldownMinutes : 30,
    paymentFailureRateThreshold: Number(
      getRuntimeEnv("ALERT_PAYMENT_FAILURE_RATE_THRESHOLD") ?? 20
    ),
  });
  const results: Array<{
    key: string;
    notification: "failed" | "recovered" | "sent" | "skipped";
    status: "firing" | "resolved";
  }> = [];

  for (const rule of rules) {
    const value = rule.value(dashboard);
    if (value === null) {
      results.push({
        key: rule.key,
        notification: "skipped",
        status: "resolved",
      });
      continue;
    }

    const dedupeKey = `${rule.key}:${dashboard.period.timezone}`;
    const [existing] = await db
      .select()
      .from(operationsAlert)
      .where(eq(operationsAlert.dedupeKey, dedupeKey))
      .limit(1);
    const state = evaluateAlertState({
      cooldownMinutes: rule.cooldownMinutes,
      cooldownUntil: existing?.cooldownUntil ?? null,
      isBreached: isRuleBreached(rule, value),
      isRecovered: isRuleRecovered(rule, value),
      now,
      previousConsecutiveCount: existing?.consecutiveCount ?? 0,
      previousStatus: isAlertRecordStatus(existing?.status)
        ? existing.status
        : null,
      requiredConsecutive: rule.requiredConsecutive,
    });
    const alertId = existing?.id ?? `alert-${crypto.randomUUID()}`;
    const row = {
      consecutiveCount: state.nextConsecutiveCount,
      cooldownUntil: state.cooldownUntil,
      dedupeKey,
      firstSeenAt: existing?.firstSeenAt ?? now,
      id: alertId,
      lastSeenAt: now,
      message: rule.message,
      resolvedAt: state.shouldResolve
        ? now
        : state.status === "resolved"
          ? (existing?.resolvedAt ?? null)
          : null,
      ruleKey: rule.key,
      severity: rule.severity,
      source: rule.source,
      status: state.status,
      threshold: Math.round(rule.threshold),
      title: rule.title,
      updatedAt: now,
      value: Math.round(value),
    };
    if (existing) {
      await db
        .update(operationsAlert)
        .set(row)
        .where(eq(operationsAlert.id, existing.id));
    } else {
      await db.insert(operationsAlert).values(row);
    }

    if (state.shouldNotify || state.shouldResolve) {
      const delivery = await alertService.notify({
        dedupeKey,
        message: state.shouldResolve ? `${rule.title}已恢复。` : rule.message,
        occurredAt: now,
        ruleKey: rule.key,
        severity: state.shouldResolve ? "info" : rule.severity,
        source: rule.source,
        threshold: rule.threshold,
        title: state.shouldResolve ? `${rule.title}已恢复` : rule.title,
        value,
      });
      await db.insert(operationsAlertDelivery).values({
        alertId,
        id: `delivery-${crypto.randomUUID()}`,
        provider: alertService.adapter.provider,
        ...(delivery.queued
          ? { sentAt: now, status: state.shouldResolve ? "recovered" : "sent" }
          : { error: "通知适配器未接受消息", status: "failed" }),
      });
      results.push({
        key: rule.key,
        notification: state.shouldResolve
          ? "recovered"
          : delivery.queued
            ? "sent"
            : "failed",
        status: state.status,
      });
    } else {
      results.push({
        key: rule.key,
        notification: "skipped",
        status: state.status,
      });
    }
  }
  return results;
}

export async function getRecentOperationsAlerts(limit = 20) {
  return db
    .select()
    .from(operationsAlert)
    .orderBy(desc(operationsAlert.lastSeenAt))
    .limit(Math.max(1, Math.min(limit, 100)));
}

function isAlertRecordStatus(
  value: string | undefined
): value is "firing" | "resolved" {
  return value === "firing" || value === "resolved";
}
