import type { RateLimitAdapter, UsageQuotaAdapter } from "@/core/services";

export const noopRateLimitAdapter: RateLimitAdapter = {
  provider: "noop",
  capabilities: { dynamicRules: true, preciseMetadata: false },
  async limit() {
    return {
      success: true,
      remaining: null,
      reset: null,
      limit: null,
      skipped: true,
    };
  },
};

export const noopUsageQuotaAdapter: UsageQuotaAdapter = {
  async check(input) {
    return { allowed: true, remaining: input.limit, reset: null };
  },
  async increment() {
    return 0;
  },
  async remaining(input) {
    return input.limit;
  },
};
