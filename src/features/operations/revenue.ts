import { PlanInterval } from "@/features/payment";

import { metric, ratioMetric } from "./metrics";
import type { MetricState, MetricStatus, RevenueHealth } from "./types";

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
  activeMrrStatus?: MetricStatus;
  revenueStatus?: MetricStatus;
  registeredUsersStatus?: MetricStatus;
}): RevenueHealth {
  const revenueSource = "database:revenue-event";
  const mrrSource = "database:subscription-price";
  const conversionSource = "database:revenue-event+auth";
  const revenueFailed = input.revenueStatus === "query-failed";
  const mrrFailed = input.activeMrrStatus === "query-failed";
  const conversionFailed =
    revenueFailed || input.registeredUsersStatus === "query-failed";
  const failed = (source: string, message: string) =>
    metric<number>(null, "query-failed", source, message);

  return {
    confirmedRevenueEvents: revenueFailed
      ? failed(revenueSource, "收入数据查询失败")
      : countMetric(input.confirmedRevenueEvents, revenueSource),
    confirmedRevenueMinor: revenueFailed
      ? failed(revenueSource, "收入数据查询失败")
      : amountMetric(
          input.confirmedRevenueMinor,
          input.confirmedRevenueEvents,
          revenueSource
        ),
    currency: input.currency,
    churnedSubscriptions: revenueFailed
      ? failed(revenueSource, "收入数据查询失败")
      : countMetric(input.churnedSubscriptions, revenueSource),
    mrrMinor: mrrFailed
      ? failed(mrrSource, "订阅数据查询失败")
      : metric(
          input.activeMrrMinor,
          input.activeMrrMinor > 0 ? "ready" : "zero-data",
          mrrSource
        ),
    paidConversionRate: conversionFailed
      ? failed(conversionSource, "转化率依赖的数据查询失败")
      : ratioMetric(input.paidUsers, input.registeredUsers, conversionSource),
    paymentFailures: revenueFailed
      ? failed(revenueSource, "收入数据查询失败")
      : countMetric(input.paymentFailures, revenueSource),
    refundsMinor: revenueFailed
      ? failed(revenueSource, "收入数据查询失败")
      : amountMetric(input.refundsMinor, input.refundEvents, revenueSource),
  };
}
