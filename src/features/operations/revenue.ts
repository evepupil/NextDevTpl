import { PlanInterval } from "@/features/payment";

import { metric, ratioMetric } from "./metrics";
import type { MetricState, RevenueHealth } from "./types";

export function calculateMrrMinor(input: {
  amount: number;
  interval: string | undefined;
}): number {
  const amountMinor = Math.round(input.amount * 100);
  return input.interval === PlanInterval.YEAR
    ? Math.round(amountMinor / 12)
    : amountMinor;
}

export function amountMetric(
  amountMinor: number,
  eventCount: number,
  source: string
): MetricState<number> {
  return metric(amountMinor, eventCount > 0 ? "ready" : "zero-data", source);
}

export function countMetric(
  value: number,
  source: string
): MetricState<number> {
  return metric(value, value > 0 ? "ready" : "zero-data", source);
}

export function buildRevenueHealth(input: {
  activeMrrMinor: number;
  confirmedRevenueMinor: number;
  confirmedRevenueEvents: number;
  currency: string;
  churnedSubscriptions: number;
  paidUsers: number;
  paymentFailures: number;
  refundsMinor: number;
  refundEvents: number;
  registeredUsers: number;
}): RevenueHealth {
  return {
    confirmedRevenueMinor: amountMetric(
      input.confirmedRevenueMinor,
      input.confirmedRevenueEvents,
      "database:revenue-event"
    ),
    currency: input.currency,
    churnedSubscriptions: countMetric(
      input.churnedSubscriptions,
      "database:revenue-event"
    ),
    mrrMinor: metric(
      input.activeMrrMinor,
      input.activeMrrMinor > 0 ? "ready" : "zero-data",
      "database:subscription-price"
    ),
    paidConversionRate: ratioMetric(
      input.paidUsers,
      input.registeredUsers,
      "database:revenue-event+auth"
    ),
    paymentFailures: countMetric(
      input.paymentFailures,
      "database:revenue-event"
    ),
    refundsMinor: amountMetric(
      input.refundsMinor,
      input.refundEvents,
      "database:revenue-event"
    ),
  };
}
