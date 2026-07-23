import type { AdapterDescriptor } from "./common";

export type RateLimitProvider = "cloudflare-rate-limit" | "noop" | "upstash";

export interface RateLimitCapabilities {
  dynamicRules: boolean;
  preciseMetadata: boolean;
}

export interface RateLimitInput {
  identifier: string;
  limit: number;
  namespace: string;
  window: `${number}${"d" | "h" | "m" | "s"}`;
}

export interface RateLimitDecision {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
  skipped: boolean;
  success: boolean;
}

export interface RateLimitAdapter
  extends AdapterDescriptor<RateLimitProvider, RateLimitCapabilities> {
  limit(input: RateLimitInput): Promise<RateLimitDecision>;
}

export interface UsageQuotaInput {
  identifier: string;
  limit: number;
  namespace: string;
  windowSeconds: number;
}

export interface UsageQuotaDecision {
  allowed: boolean;
  remaining: number;
  reset: number | null;
}

export interface UsageQuotaAdapter {
  check(input: UsageQuotaInput): Promise<UsageQuotaDecision>;
  increment(input: UsageQuotaInput): Promise<number>;
  remaining(input: UsageQuotaInput): Promise<number>;
}
