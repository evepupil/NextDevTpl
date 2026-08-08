import { and, count, eq, gte, lt, sum } from "drizzle-orm";

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
import type { MetricState, OperationsDashboard } from "./types";

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
  occurredAt: Date;
  provider: string;
  status: string;
  success: boolean;
  totalTokens: number | null;
  userId: string | null;
}

interface OperationsDateParts {
  day: number;
  month: number;
  year: number;
}

function getOperationsDateParts(
  date: Date,
  timezone: string
): OperationsDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    calendar: "iso8601",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      if (part.type !== "literal") result[part.type] = part.value;
      return result;
    }, {});

  return {
    day: Number(parts.day),
    month: Number(parts.month),
    year: Number(parts.year),
  };
}

function getOperationsDatePartsWithTime(
  date: Date,
  timezone: string
): OperationsDateParts & { hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    calendar: "iso8601",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: timezone,
    year: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((result, part) => {
      if (part.type !== "literal") result[part.type] = part.value;
      return result;
    }, {});

  return {
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    month: Number(parts.month),
    second: Number(parts.second),
    year: Number(parts.year),
  };
}

function getTimezoneOffset(date: Date, timezone: string): number {
  const parts = getOperationsDatePartsWithTime(date, timezone);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    ) - date.getTime()
  );
}

function startOfOperationsDay(
  date: OperationsDateParts,
  timezone: string
): Date {
  const localMidnight = Date.UTC(date.year, date.month - 1, date.day);
  let instant = localMidnight;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = localMidnight - getTimezoneOffset(new Date(instant), timezone);
  }
  return new Date(instant);
}

function shiftCalendarDate(
  date: OperationsDateParts,
  days: number
): OperationsDateParts {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days)
  );
  return {
    day: shifted.getUTCDate(),
    month: shifted.getUTCMonth() + 1,
    year: shifted.getUTCFullYear(),
  };
}

export function normalizeOperationsTimezone(timezone?: string): string {
  const candidate = timezone?.trim() || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return "UTC";
  }
}

export function formatOperationsDate(date: Date, timezone: string): string {
  const parts = getOperationsDateParts(
    date,
    normalizeOperationsTimezone(timezone)
  );
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

export function getOperationsPeriod(options: OperationsPeriodOptions = {}) {
  const now = options.now ?? new Date();
  const timezone = normalizeOperationsTimezone(options.timezone);
  const localDate = getOperationsDateParts(now, timezone);
  const end = startOfOperationsDay(localDate, timezone);
  const start = startOfOperationsDay(
    shiftCalendarDate(localDate, -30),
    timezone
  );
  return {
    end,
    start,
    timezone,
  };
}

type QueryState<T> = { ok: true; value: T } | { ok: false };

async function settleQuery<T>(
  query: () => PromiseLike<T>
): Promise<QueryState<T>> {
  try {
    return { ok: true, value: await query() };
  } catch {
    return { ok: false };
  }
}

function queryFailedMetric<T>(source: string, message: string): MetricState<T> {
  return metric<T>(null, "query-failed", source, message);
}

function countQueryMetric(
  state: QueryState<unknown>,
  value: number,
  source: string,
  message: string
): MetricState<number> {
  return state.ok
    ? metric(value, value > 0 ? "ready" : "zero-data", source)
    : queryFailedMetric<number>(source, message);
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
    settleQuery(() => db.select({ value: count() }).from(user)),
    settleQuery(() =>
      db
        .select({ value: count() })
        .from(subscription)
        .where(eq(subscription.status, "active"))
    ),
    settleQuery(() =>
      db
        .select({ value: count() })
        .from(ticket)
        .where(
          and(eq(ticket.status, "open"), gte(ticket.createdAt, period.start))
        )
    ),
    settleQuery(() =>
      db.select({ value: sum(creditsBalance.balance) }).from(creditsBalance)
    ),
    settleQuery(() =>
      db
        .select({ value: count() })
        .from(user)
        .where(
          and(gte(user.createdAt, period.start), lt(user.createdAt, period.end))
        )
    ),
    settleQuery(() =>
      db
        .select({ value: sum(creditsTransaction.amount) })
        .from(creditsTransaction)
        .where(
          and(
            eq(creditsTransaction.type, "consumption"),
            gte(creditsTransaction.createdAt, period.start),
            lt(creditsTransaction.createdAt, period.end)
          )
        )
    ),
    settleQuery(() =>
      db
        .select({ value: count() })
        .from(ticket)
        .where(
          and(
            gte(ticket.createdAt, period.start),
            lt(ticket.createdAt, period.end)
          )
        )
    ),
    settleQuery(() =>
      db
        .select({ priceId: subscription.priceId })
        .from(subscription)
        .where(eq(subscription.status, "active"))
    ),
    settleQuery(() =>
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
        )
    ),
    settleQuery(() =>
      db
        .select({
          feature: aiUsageEvent.feature,
          inputTokens: aiUsageEvent.inputTokens,
          latencyMs: aiUsageEvent.latencyMs,
          model: aiUsageEvent.model,
          occurredAt: aiUsageEvent.occurredAt,
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
        )
    ),
  ]);

  const totalUsersValue = totalUsers.ok
    ? Number(totalUsers.value[0]?.value ?? 0)
    : 0;
  const activeSubscriptionsValue = activeSubscriptions.ok
    ? Number(activeSubscriptions.value[0]?.value ?? 0)
    : 0;
  const openTicketsValue = openTickets.ok
    ? Number(openTickets.value[0]?.value ?? 0)
    : 0;
  const creditTotalValue = creditTotal.ok
    ? Number(creditTotal.value[0]?.value ?? 0)
    : 0;
  const newUsersValue = newUsers.ok ? Number(newUsers.value[0]?.value ?? 0) : 0;
  const creditConsumptionValue = creditConsumption.ok
    ? Number(creditConsumption.value[0]?.value ?? 0)
    : 0;
  const supportTicketsValue = supportTickets.ok
    ? Number(supportTickets.value[0]?.value ?? 0)
    : 0;
  const activeSubscriptionRowsValue = activeSubscriptionRows.ok
    ? activeSubscriptionRows.value
    : [];
  const revenueRowsValue = revenueRows.ok ? revenueRows.value : [];
  const aiUsageRowsValue = aiUsageRows.ok ? aiUsageRows.value : [];

  const activeMrrMinor = activeSubscriptionRowsValue.reduce((total, item) => {
    const price = findPlanByPriceId(item.priceId).price;
    return price
      ? total +
          calculateMrrMinor({ amount: price.amount, interval: price.interval })
      : total;
  }, 0);
  const succeededRevenue = revenueRowsValue.filter(
    (event) => event.kind === "payment_succeeded"
  );
  const paidUsers = new Set(
    succeededRevenue.flatMap((event) => (event.userId ? [event.userId] : []))
  ).size;
  const confirmedRevenueMinor = succeededRevenue.reduce(
    (total, event) => total + event.amountMinor,
    0
  );
  const refunds = revenueRowsValue.filter((event) => event.kind === "refund");
  const refundsMinor = refunds.reduce(
    (total, event) => total + event.amountMinor,
    0
  );
  const currency = revenueRowsValue[0]?.currency ?? paymentConfig.currency;
  const aiCosts = aiUsageRowsValue.map((event) =>
    estimateAICost({
      model: event.model,
      occurredAt: event.occurredAt,
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
  const aiRevenueSource = "database:revenue-event+ai-usage-event";
  const aiRequests = aiUsageRowsValue.length;
  const aiQueryFailed = !aiUsageRows.ok;
  const revenueQueryFailed = !revenueRows.ok;
  const aiBreakdowns = {
    feature: buildAIBreakdown(
      aiUsageRowsValue,
      aiCosts,
      (event) => event.feature
    ),
    model: buildAIBreakdown(
      aiUsageRowsValue,
      aiCosts,
      (event) => `${event.provider}/${event.model}`
    ),
    user: buildAIBreakdown(
      aiUsageRowsValue,
      aiCosts,
      (event) => event.userId ?? "anonymous"
    ),
  };
  const ai: OperationsDashboard["ai"] = {
    byFeature: aiBreakdowns.feature,
    byModel: aiBreakdowns.model,
    byUser: aiBreakdowns.user,
    costMinor: aiQueryFailed
      ? queryFailedMetric<number>(aiSource, "AI 使用数据查询失败")
      : metric(
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
    grossMarginMinor:
      aiQueryFailed || revenueQueryFailed
        ? queryFailedMetric<number>(aiRevenueSource, "毛利依赖的数据查询失败")
        : metric(
            aiRequests === 0 || confirmedRevenueMinor === 0
              ? null
              : aiMargin.marginMinor,
            aiMargin.rate === null ? "zero-data" : "ready",
            aiRevenueSource
          ),
    grossMarginRate:
      aiQueryFailed || revenueQueryFailed
        ? queryFailedMetric<number>(aiRevenueSource, "毛利依赖的数据查询失败")
        : metric(
            aiMargin.rate,
            aiMargin.rate === null ? "zero-data" : "ready",
            aiRevenueSource
          ),
    latencyMs: aiQueryFailed
      ? queryFailedMetric<number>(aiSource, "AI 使用数据查询失败")
      : metric(
          aiRequests === 0
            ? null
            : Math.round(
                aiUsageRowsValue.reduce(
                  (total, event) => total + event.latencyMs,
                  0
                ) / aiRequests
              ),
          aiRequests === 0 ? "zero-data" : "ready",
          aiSource
        ),
    requests: aiQueryFailed
      ? queryFailedMetric<number>(aiSource, "AI 使用数据查询失败")
      : metric(aiRequests, aiRequests > 0 ? "ready" : "zero-data", aiSource),
    successRate: aiQueryFailed
      ? queryFailedMetric<number>(aiSource, "AI 使用数据查询失败")
      : ratioMetric(
          aiUsageRowsValue.filter((event) => event.success).length,
          aiRequests,
          aiSource
        ),
    tokenUsageCoverage: aiQueryFailed
      ? queryFailedMetric<number>(aiSource, "AI 使用数据查询失败")
      : metric(
          aiRequests === 0
            ? null
            : usageCoverageStatus(
                aiUsageRowsValue.map((event) =>
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
      registeredUsers: newUsersValue,
      ...(revenueRows.ok ? {} : { paidUsersStatus: "query-failed" as const }),
      ...(newUsers.ok
        ? {}
        : { registeredUsersStatus: "query-failed" as const }),
    }),
    generatedAt,
    health: createHealth(),
    overview: {
      activeSubscriptions: countQueryMetric(
        activeSubscriptions,
        activeSubscriptionsValue,
        source,
        "订阅数据查询失败"
      ),
      creditsBalance: countQueryMetric(
        creditTotal,
        creditTotalValue,
        source,
        "积分数据查询失败"
      ),
      openTickets: countQueryMetric(
        openTickets,
        openTicketsValue,
        source,
        "工单数据查询失败"
      ),
      totalUsers: countQueryMetric(
        totalUsers,
        totalUsersValue,
        source,
        "用户数据查询失败"
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
      churnedSubscriptions: revenueRowsValue.filter(
        (event) => event.kind === "subscription_canceled"
      ).length,
      paidUsers,
      paymentFailures: revenueRowsValue.filter(
        (event) => event.kind === "payment_failed"
      ).length,
      refundsMinor,
      refundEvents: refunds.length,
      registeredUsers: newUsersValue,
      ...(activeSubscriptionRows.ok
        ? {}
        : { activeMrrStatus: "query-failed" as const }),
      ...(newUsers.ok
        ? {}
        : { registeredUsersStatus: "query-failed" as const }),
      ...(revenueRows.ok ? {} : { revenueStatus: "query-failed" as const }),
    }),
    retention: createRetention(),
    usage: {
      creditConsumption: countQueryMetric(
        creditConsumption,
        creditConsumptionValue,
        source,
        "积分消耗数据查询失败"
      ),
      newUsers: countQueryMetric(
        newUsers,
        newUsersValue,
        source,
        "用户数据查询失败"
      ),
      supportTickets: countQueryMetric(
        supportTickets,
        supportTicketsValue,
        source,
        "工单数据查询失败"
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
