import { and, desc, eq, gte } from "drizzle-orm";

import { db, withDbTransaction } from "@/db";
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

type NotificationKind = "firing" | "recovered";

interface AlertNotificationClaim {
  alertId: string;
  dedupeKey: string;
  deliveryId: string;
  kind: NotificationKind;
  message: string;
  occurredAt: Date;
  ruleKey: string;
  severity: "critical" | "info" | "warning";
  source: string;
  threshold: number;
  title: string;
  value: number;
}

interface PreparedAlert {
  claim: AlertNotificationClaim | null;
  status: "firing" | "resolved";
}

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
    let status: "firing" | "resolved" = "resolved";
    try {
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
      const prepared = await prepareAlert({
        dedupeKey,
        now,
        rule,
        value,
      });
      status = prepared.status;

      if (!prepared.claim) {
        results.push({
          key: rule.key,
          notification: "skipped",
          status: prepared.status,
        });
        continue;
      }

      const delivery = await alertService.notify(prepared.claim);
      await db
        .update(operationsAlertDelivery)
        .set(
          delivery.queued
            ? {
                sentAt: now,
                status:
                  prepared.claim.kind === "recovered" ? "recovered" : "sent",
              }
            : {
                error: "通知适配器未接受消息",
                status: "failed",
              }
        )
        .where(eq(operationsAlertDelivery.id, prepared.claim.deliveryId));

      results.push({
        key: rule.key,
        notification:
          delivery.queued
            ? prepared.claim.kind === "recovered"
              ? "recovered"
              : "sent"
            : "failed",
        status: prepared.status,
      });
    } catch (error) {
      console.error("Operations alert evaluation failed", {
        error,
        ruleKey: rule.key,
      });
      results.push({
        key: rule.key,
        notification: "failed",
        status,
      });
    }
  }
  return results;
}

async function prepareAlert(input: {
  dedupeKey: string;
  now: Date;
  rule: ReturnType<typeof getOperationsAlertRules>[number];
  value: number;
}): Promise<PreparedAlert> {
  return withDbTransaction(async (tx) => {
    let existing = (
      await tx
        .select()
        .from(operationsAlert)
        .where(eq(operationsAlert.dedupeKey, input.dedupeKey))
        .for("update")
        .limit(1)
    )[0];

    for (;;) {
      const previousStatus = isAlertRecordStatus(existing?.status)
        ? existing.status
        : null;
      const hasSuccessfulNotification = existing
        ? await hasSuccessfulFiringDelivery(tx, existing)
        : false;
      const state = evaluateAlertState({
        cooldownMinutes: input.rule.cooldownMinutes,
        cooldownUntil: existing?.cooldownUntil ?? null,
        hasSuccessfulNotification,
        isBreached: isRuleBreached(input.rule, input.value),
        isRecovered: isRuleRecovered(input.rule, input.value),
        now: input.now,
        previousConsecutiveCount: existing?.consecutiveCount ?? 0,
        previousStatus,
        requiredConsecutive: input.rule.requiredConsecutive,
      });
      const alertId = existing?.id ?? `alert-${crypto.randomUUID()}`;
      const startsNewCycle =
        state.status === "firing" && previousStatus !== "firing";
      const firstSeenAt = startsNewCycle
        ? input.now
        : (existing?.firstSeenAt ?? input.now);
      const row = {
        consecutiveCount: state.nextConsecutiveCount,
        cooldownUntil: state.cooldownUntil,
        dedupeKey: input.dedupeKey,
        firstSeenAt,
        id: alertId,
        lastSeenAt: input.now,
        message: input.rule.message,
        resolvedAt: state.shouldResolve
          ? input.now
          : state.status === "resolved"
            ? (existing?.resolvedAt ?? null)
            : null,
        ruleKey: input.rule.key,
        severity: input.rule.severity,
        source: input.rule.source,
        status: state.status,
        threshold: Math.round(input.rule.threshold),
        title: input.rule.title,
        updatedAt: input.now,
        value: Math.round(input.value),
      };

      if (!existing) {
        const inserted = await tx
          .insert(operationsAlert)
          .values(row)
          .onConflictDoNothing()
          .returning({ id: operationsAlert.id });
        if (!inserted[0]) {
          existing = (
            await tx
              .select()
              .from(operationsAlert)
              .where(eq(operationsAlert.dedupeKey, input.dedupeKey))
              .for("update")
              .limit(1)
          )[0];
          if (existing) continue;
          throw new Error("无法读取刚写入的告警状态");
        }
      } else {
        await tx
          .update(operationsAlert)
          .set(row)
          .where(eq(operationsAlert.id, existing.id));
      }

      const kind: NotificationKind | null = state.shouldNotify
        ? "firing"
        : state.shouldNotifyRecovery
          ? "recovered"
          : null;
      if (!kind) return { claim: null, status: state.status };

      const deliveryId = createDeliveryId(
        alertId,
        kind,
        state.cooldownUntil,
        input.now
      );
      const delivery = await tx
        .insert(operationsAlertDelivery)
        .values({
          alertId,
          id: deliveryId,
          provider: alertService.adapter.provider,
          status: "pending",
        })
        .onConflictDoNothing()
        .returning({ id: operationsAlertDelivery.id });
      if (!delivery[0]) return { claim: null, status: state.status };

      return {
        claim: {
          alertId,
          dedupeKey: input.dedupeKey,
          deliveryId,
          kind,
          message:
            kind === "recovered"
              ? `${input.rule.title}已恢复`
              : input.rule.message,
          occurredAt: input.now,
          ruleKey: input.rule.key,
          severity: kind === "recovered" ? "info" : input.rule.severity,
          source: input.rule.source,
          threshold: input.rule.threshold,
          title:
            kind === "recovered"
              ? `${input.rule.title}已恢复`
              : input.rule.title,
          value: input.value,
        },
        status: state.status,
      };
    }
  });
}

async function hasSuccessfulFiringDelivery(
  tx: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  existing: typeof operationsAlert.$inferSelect
): Promise<boolean> {
  if (existing.status !== "firing") return false;

  const [delivery] = await tx
    .select({ id: operationsAlertDelivery.id })
    .from(operationsAlertDelivery)
    .where(
      and(
        eq(operationsAlertDelivery.alertId, existing.id),
        eq(operationsAlertDelivery.status, "sent"),
        gte(operationsAlertDelivery.sentAt, existing.firstSeenAt)
      )
    )
    .limit(1);
  return Boolean(delivery);
}

function createDeliveryId(
  alertId: string,
  kind: NotificationKind,
  cooldownUntil: Date | null,
  now: Date
): string {
  const occurrence = (cooldownUntil ?? now).toISOString();
  return `delivery:${alertId}:${kind}:${occurrence}`;
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
