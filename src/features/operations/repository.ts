import { and, count, eq, gte, lt, sum } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { creditsBalance, creditsTransaction } from "@/db/schema/credits";
import { subscription } from "@/db/schema/subscription";
import { ticket } from "@/db/schema/support";

import { createFunnel, createHealth, createRetention, metric } from "./metrics";
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
    paidUsers,
    creditConsumption,
    supportTickets,
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
      .select({ value: count() })
      .from(subscription)
      .where(
        and(
          eq(subscription.status, "active"),
          gte(subscription.createdAt, period.start),
          lt(subscription.createdAt, period.end)
        )
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
  ]);

  const generatedAt = new Date().toISOString();
  const source = "database:auth-subscription-credits-support";
  const dashboard: OperationsDashboard = {
    funnel: createFunnel({
      paidUsers: Number(paidUsers[0]?.value ?? 0),
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
