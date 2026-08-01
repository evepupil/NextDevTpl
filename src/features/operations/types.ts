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

export interface AIUsageBreakdown {
  costMinor: number;
  key: string;
  requests: number;
  totalTokens: number;
}

export interface AIHealth {
  byFeature: AIUsageBreakdown[];
  byModel: AIUsageBreakdown[];
  byUser: AIUsageBreakdown[];
  costMinor: MetricState<number>;
  currency: string;
  grossMarginMinor: MetricState<number>;
  grossMarginRate: MetricState<number>;
  latencyMs: MetricState<number>;
  requests: MetricState<number>;
  successRate: MetricState<number>;
  tokenUsageCoverage: MetricState<number>;
}

export interface RevenueHealth {
  confirmedRevenueMinor: MetricState<number>;
  currency: string;
  churnedSubscriptions: MetricState<number>;
  mrrMinor: MetricState<number>;
  paidConversionRate: MetricState<number>;
  paymentFailures: MetricState<number>;
  refundsMinor: MetricState<number>;
}

export interface OperationsDashboard {
  ai: AIHealth;
  funnel: OperationsFunnel;
  generatedAt: string;
  health: OperationsHealth;
  overview: OperationsOverview;
  period: { end: string; start: string; timezone: string };
  revenue: RevenueHealth;
  retention: OperationsRetention;
  usage: OperationsUsage;
}

export type OperationsSnapshotPayload = OperationsDashboard;
