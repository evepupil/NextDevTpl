import type {
  MetricState,
  MetricStatus,
  OperationsFunnel,
  OperationsHealth,
  OperationsRetention,
} from "./types";

export function metric<T>(
  value: T | null,
  status: MetricStatus,
  source: string,
  message?: string
): MetricState<T> {
  return {
    ...(message ? { message } : {}),
    source,
    status,
    value,
  };
}

export function ratioMetric(
  numerator: number,
  denominator: number,
  source: string
): MetricState<number> {
  if (denominator <= 0) return metric<number>(null, "zero-data", source);
  return metric(
    Math.round((numerator / denominator) * 10000) / 100,
    "ready",
    source
  );
}

export function createUnavailableMetric(
  source: string,
  message = "当前适配器不提供此指标"
): MetricState<number> {
  return metric<number>(null, "not-configured", source, message);
}

export function createFunnel(input: {
  paidUsers: number;
  registeredUsers: number;
}): OperationsFunnel {
  const source = "database:user-and-subscription";
  return {
    activatedUsers: createUnavailableMetric("analytics:activation"),
    landingVisitors: createUnavailableMetric("analytics:landing"),
    paidUsers: metric(
      input.paidUsers,
      input.paidUsers > 0 ? "ready" : "zero-data",
      source
    ),
    registeredUsers: metric(
      input.registeredUsers,
      input.registeredUsers > 0 ? "ready" : "zero-data",
      source
    ),
  };
}

export function createRetention(): OperationsRetention {
  return {
    d1: createUnavailableMetric("analytics:retention"),
    d7: createUnavailableMetric("analytics:retention"),
    d30: createUnavailableMetric("analytics:retention"),
  };
}

export function createHealth(): OperationsHealth {
  return {
    apiSuccessRate: createUnavailableMetric("logs:api"),
    jobSuccessRate: createUnavailableMetric("logs:jobs"),
    webhookSuccessRate: createUnavailableMetric("logs:webhooks"),
  };
}
