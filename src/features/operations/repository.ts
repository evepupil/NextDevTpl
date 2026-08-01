import { and, count, eq, gte, inArray, lt, sum } from "drizzle-orm";

import { findPlanByPriceId, paymentConfig } from "@/config/payment";
import type { AIUsageStatus } from "@/core/services";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { creditsBalance, creditsTransaction } from "@/db/schema/credits";
import { aiUsageEvent } from "@/db/schema/operations";
import { revenueEvent } from "@/db/schema/payment";
import { subscription } from "@/db/schema/subscription";
import { ticket } from "@/db/schema/support";

import {
  calculateAIGrossMargin,
  estimateAICost,
  usageCoverageStatus,
} from "./ai-usage";
import {
  createFunnel,
  createHealth,
  createRetention,
  metric,
  ratioMetric,
} from "./metrics";
import { buildRevenueHealth, calculateMrrMinor } from "./revenue";
import type { OperationsDashboard } from "./types";

export interface OperationsPeriodOptions {
  now?: Date;
  timezone?: string;
}

interface AIUsageRow {
  feature: string;
  inputTokens: number | null;
  latencyMs: number;
  model: string;
  outputTokens: number | null;
  provider: string;
  status: string;
  success: boolean;
  totalTokens: number | null;
  userId: string | null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getOperationsPeriod(options: OperationsPeriodOptions = {}) {
  const now = options.now ?? new Date();
  const end = startOfUtcDay(now);
  const start = addDays(end, -30);
  return {
    end,
    start,
    timezone: options.timezone ?? "UTC",
  };
}

export async function getOperationsDashboard(
  options: OperationsPeriodOptions = {}
): Promise<OperationsDashboard> {
  const period = getOperationsPeriod(options);
  const [
    totalUsers,
    activeSubscriptions,
    openTickets,
    creditTotal,
    newUsers,
    creditConsumption,
    supportTickets,
    activeSubscriptionRows,
    revenueRows,
    aiUsageRows,
  ] = await Promise.all([
    db.select({ value: count() }).from(user),
    db
      .select({ value: count() })
      .from(subscription)
      .where(eq(subscription.status, "active")),
    db
      .select({ value: count() })
      .from(ticket)
      .where(
        and(eq(ticket.status, "open"), gte(ticket.createdAt, period.start))
      ),
    db.select({ value: sum(creditsBalance.balance) }).from(creditsBalance),
    db
      .select({ value: count() })
      .from(user)
      .where(
        and(gte(user.createdAt, period.start), lt(user.createdAt, period.end))
      ),
    db
      .select({ value: sum(creditsTransaction.amount) })
      .from(creditsTransaction)
      .where(
        and(
          eq(creditsTransaction.type, "consumption"),
          gte(creditsTransaction.createdAt, period.start),
          lt(creditsTransaction.createdAt, period.end)
        )
      ),
    db
      .select({ value: count() })
      .from(ticket)
      .where(
        and(
          gte(ticket.createdAt, period.start),
          lt(ticket.createdAt, period.end)
        )
      ),
    db
      .select({ priceId: subscription.priceId })
      .from(subscription)
      .where(inArray(subscription.status, ["active", "trialing"])),
    db
      .select({
        amountMinor: revenueEvent.amountMinor,
        currency: revenueEvent.currency,
        kind: revenueEvent.kind,
        userId: revenueEvent.userId,
      })
      .from(revenueEvent)
      .where(
        and(
          gte(revenueEvent.occurredAt, period.start),
          lt(revenueEvent.occurredAt, period.end)
        )
      ),
    db
      .select({
        feature: aiUsageEvent.feature,
        inputTokens: aiUsageEvent.inputTokens,
        latencyMs: aiUsageEvent.latencyMs,
        model: aiUsageEvent.model,
        outputTokens: aiUsageEvent.outputTokens,
        provider: aiUsageEvent.provider,
        status: aiUsageEvent.usageStatus,
        success: aiUsageEvent.success,
        totalTokens: aiUsageEvent.totalTokens,
        userId: aiUsageEvent.userId,
      })
      .from(aiUsageEvent)
      .where(
        and(
          gte(aiUsageEvent.occurredAt, period.start),
          lt(aiUsageEvent.occurredAt, period.end)
        )
      ),
  ]);

  const activeMrrMinor = activeSubscriptionRows.reduce((total, item) => {
    const price = findPlanByPriceId(item.priceId).price;
    return price
      ? total +
          calculateMrrMinor({ amount: price.amount, interval: price.interval })
      : total;
  }, 0);
  const succeededRevenue = revenueRows.filter(
    (event) => event.kind === "payment_succeeded"
  );
  const paidUsers = new Set(
    succeededRevenue.flatMap((event) => (event.userId ? [event.userId] : []))
  ).size;
  const confirmedRevenueMinor = succeededRevenue.reduce(
    (total, event) => total + event.amountMinor,
    0
  );
  const refunds = revenueRows.filter((event) => event.kind === "refund");
  const refundsMinor = refunds.reduce(
    (total, event) => total + event.amountMinor,
    0
  );
  const currency = revenueRows[0]?.currency ?? paymentConfig.currency;
  const aiCosts = aiUsageRows.map((event) =>
    estimateAICost({
      model: event.model,
      occurredAt: period.end,
      provider: event.provider,
      usage: {
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
        status: isAIUsageStatus(event.status) ? event.status : "unavailable",
        totalTokens: event.totalTokens,
      },
    })
  );
  const estimatedAICostMinor = aiCosts.reduce(
    (total, cost) => total + (cost.amountMinor ?? 0),
    0
  );
  const aiMargin = calculateAIGrossMargin({
    costMinor: estimatedAICostMinor,
    revenueMinor: confirmedRevenueMinor,
  });
  const aiSource = "database:ai-usage-event";
  const aiRequests = aiUsageRows.length;
  const aiBreakdowns = {
    feature: buildAIBreakdown(aiUsageRows, aiCosts, (event) => event.feature),
    model: buildAIBreakdown(
      aiUsageRows,
      aiCosts,
      (event) => `${event.provider}/${event.model}`
    ),
    user: buildAIBreakdown(
      aiUsageRows,
      aiCosts,
      (event) => event.userId ?? "anonymous"
    ),
  };
  const ai: OperationsDashboard["ai"] = {
    byFeature: aiBreakdowns.feature,
    byModel: aiBreakdowns.model,
    byUser: aiBreakdowns.user,
    costMinor: metric(
      estimatedAICostMinor,
      aiRequests === 0
        ? "zero-data"
        : aiCosts.some((cost) => cost.amountMinor !== null)
          ? "ready"
          : "not-configured",
      aiSource,
      aiCosts.some((cost) => cost.amountMinor === null)
        ? "部分请求缺少可用价格或 Token，成本为估算值"
        : undefined
    ),
    currency: aiCosts[0]?.currency ?? paymentConfig.currency,
    grossMarginMinor: metric(
      aiRequests === 0 || confirmedRevenueMinor === 0
        ? null
        : aiMargin.marginMinor,
      aiMargin.rate === null ? "zero-data" : "ready",
      "database:revenue-event+ai-usage-event"
    ),
    grossMarginRate: metric(
      aiMargin.rate,
      aiMargin.rate === null ? "zero-data" : "ready",
      "database:revenue-event+ai-usage-event"
    ),
    latencyMs: metric(
      aiRequests === 0
        ? null
        : Math.round(
            aiUsageRows.reduce((total, event) => total + event.latencyMs, 0) /
              aiRequests
          ),
      aiRequests === 0 ? "zero-data" : "ready",
      aiSource
    ),
    requests: metric(
      aiRequests,
      aiRequests > 0 ? "ready" : "zero-data",
      aiSource
    ),
    successRate: ratioMetric(
      aiUsageRows.filter((event) => event.success).length,
      aiRequests,
      aiSource
    ),
    tokenUsageCoverage: metric(
      aiRequests === 0
        ? null
        : usageCoverageStatus(
            aiUsageRows.map((event) =>
              isAIUsageStatus(event.status) ? event.status : "unavailable"
            )
          ),
      aiRequests === 0 ? "zero-data" : "ready",
      aiSource
    ),
  };

  const generatedAt = new Date().toISOString();
  const source = "database:auth-subscription-credits-support";
  const dashboard: OperationsDashboard = {
    ai,
    funnel: createFunnel({
      paidUsers,
      registeredUsers: Number(newUsers[0]?.value ?? 0),
    }),
    generatedAt,
    health: createHealth(),
    overview: {
      activeSubscriptions: metric(
        Number(activeSubscriptions[0]?.value ?? 0),
        activeSubscriptions[0]?.value ? "ready" : "zero-data",
        source
      ),
      creditsBalance: metric(
        Number(creditTotal[0]?.value ?? 0),
        creditTotal[0]?.value ? "ready" : "zero-data",
        source
      ),
      openTickets: metric(
        Number(openTickets[0]?.value ?? 0),
        openTickets[0]?.value ? "ready" : "zero-data",
        source
      ),
      totalUsers: metric(
        Number(totalUsers[0]?.value ?? 0),
        totalUsers[0]?.value ? "ready" : "zero-data",
        source
      ),
    },
    period: {
      end: period.end.toISOString(),
      start: period.start.toISOString(),
      timezone: period.timezone,
    },
    revenue: buildRevenueHealth({
      activeMrrMinor,
      confirmedRevenueEvents: succeededRevenue.length,
      confirmedRevenueMinor,
      currency,
      churnedSubscriptions: revenueRows.filter(
        (event) => event.kind === "subscription_canceled"
      ).length,
      paidUsers,
      paymentFailures: revenueRows.filter(
        (event) => event.kind === "payment_failed"
      ).length,
      refundsMinor,
      refundEvents: refunds.length,
      registeredUsers: Number(newUsers[0]?.value ?? 0),
    }),
    retention: createRetention(),
    usage: {
      creditConsumption: metric(
        Number(creditConsumption[0]?.value ?? 0),
        creditConsumption[0]?.value ? "ready" : "zero-data",
        source
      ),
      newUsers: metric(
        Number(newUsers[0]?.value ?? 0),
        newUsers[0]?.value ? "ready" : "zero-data",
        source
      ),
      supportTickets: metric(
        Number(supportTickets[0]?.value ?? 0),
        supportTickets[0]?.value ? "ready" : "zero-data",
        source
      ),
    },
  };

  return dashboard;
}

function isAIUsageStatus(value: string): value is AIUsageStatus {
  return value === "actual" || value === "estimated" || value === "unavailable";
}

function buildAIBreakdown(
  rows: readonly AIUsageRow[],
  costs: ReadonlyArray<{ amountMinor: number | null }>,
  keyFor: (row: AIUsageRow) => string
) {
  const groups = new Map<
    string,
    { costMinor: number; requests: number; totalTokens: number }
  >();
  rows.forEach((row, index) => {
    const key = keyFor(row);
    const existing = groups.get(key) ?? {
      costMinor: 0,
      requests: 0,
      totalTokens: 0,
    };
    existing.costMinor += costs[index]?.amountMinor ?? 0;
    existing.requests += 1;
    existing.totalTokens += row.totalTokens ?? 0;
    groups.set(key, existing);
  });
  return [...groups.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((left, right) => right.requests - left.requests);
}
