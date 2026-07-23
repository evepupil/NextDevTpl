export type HealthCheckStatus = "fail" | "pass";

export interface HealthCheckResult {
  durationMs: number;
  status: HealthCheckStatus;
}

export interface HealthReport {
  checks: Readonly<Record<string, HealthCheckResult>>;
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
}
