import { and, count, eq, gte, inArray, lt, sum } from "drizzle-orm";

import { findPlanByPriceId, paymentConfig } from "@/config/payment";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { creditsBalance, creditsTransaction } from "@/db/schema/credits";
import { revenueEvent } from "@/db/schema/payment";
import { subscription } from "@/db/schema/subscription";
import { ticket } from "@/db/schema/support";

import { createFunnel, createHealth, createRetention, metric } from "./metrics";
import { buildRevenueHealth, calculateMrrMinor } from "./revenue";
import type { OperationsDashboard } from "./types";

export interface OperationsPeriodOptions {
  now?: Date;
  timezone?: string;
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

  const generatedAt = new Date().toISOString();
  const source = "database:auth-subscription-credits-support";
  const dashboard: OperationsDashboard = {
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
