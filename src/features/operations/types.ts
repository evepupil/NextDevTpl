export type MetricStatus =
  | "not-configured"
  | "partial"
  | "query-failed"
  | "ready"
  | "unauthorized"
  | "zero-data";

export interface MetricState<T> {
  message?: string;
  source: string;
  status: MetricStatus;
  value: T | null;
}

export interface OperationsOverview {
  activeSubscriptions: MetricState<number>;
  creditsBalance: MetricState<number>;
  openTickets: MetricState<number>;
  totalUsers: MetricState<number>;
}

export interface OperationsFunnel {
  activatedUsers: MetricState<number>;
  landingVisitors: MetricState<number>;
  paidUsers: MetricState<number>;
  registeredUsers: MetricState<number>;
}

export interface OperationsRetention {
  d1: MetricState<number>;
  d7: MetricState<number>;
  d30: MetricState<number>;
}

export interface OperationsUsage {
  creditConsumption: MetricState<number>;
  newUsers: MetricState<number>;
  supportTickets: MetricState<number>;
}

export interface OperationsHealth {
  apiSuccessRate: MetricState<number>;
  jobSuccessRate: MetricState<number>;
  webhookSuccessRate: MetricState<number>;
}

export interface OperationsDashboard {
  funnel: OperationsFunnel;
  generatedAt: string;
  health: OperationsHealth;
  overview: OperationsOverview;
  period: { end: string; start: string; timezone: string };
  retention: OperationsRetention;
  usage: OperationsUsage;
}

export type OperationsSnapshotPayload = OperationsDashboard;
