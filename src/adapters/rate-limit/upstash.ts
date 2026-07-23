import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type {
  RateLimitAdapter,
  RateLimitInput,
  UsageQuotaAdapter,
  UsageQuotaInput,
} from "@/core/services";
import { executeAdapterOperation } from "@/core/services";

interface UpstashConfig {
  token: string;
  url: string;
}

export interface UpstashServices {
  quota: UsageQuotaAdapter;
  rateLimit: RateLimitAdapter;
}

export function createUpstashServices(config: UpstashConfig): UpstashServices {
  const redis = new Redis({ url: config.url, token: config.token });
  const limiters = new Map<string, Ratelimit>();

  function limiterFor(input: RateLimitInput): Ratelimit {
    const cacheKey = `${input.namespace}:${input.limit}:${input.window}`;
    const existing = limiters.get(cacheKey);
    if (existing) {
      return existing;
    }
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(input.limit, input.window),
      prefix: `ratelimit:${input.namespace}`,
      analytics: true,
    });
    limiters.set(cacheKey, limiter);
    return limiter;
  }

  function quotaKey(input: UsageQuotaInput): string {
    return `quota:${input.namespace}:${input.identifier}`;
  }

  return {
    rateLimit: {
      provider: "upstash",
      capabilities: { dynamicRules: true, preciseMetadata: true },
      async limit(input) {
        const result = await executeAdapterOperation({
          provider: "upstash",
          fallbackMessage: "Upstash rate limit check failed",
          secrets: [config.token],
          operation: () => limiterFor(input).limit(input.identifier),
        });
        return {
          success: result.success,
          remaining: result.remaining,
          reset: result.reset,
          limit: result.limit,
          skipped: false,
        };
      },
    },

    quota: {
      async check(input) {
        const key = quotaKey(input);
        const [currentValue, ttl] = await executeAdapterOperation({
          provider: "upstash",
          fallbackMessage: "Upstash quota check failed",
          secrets: [config.token],
          operation: () =>
            Promise.all([redis.get<number>(key), redis.ttl(key)]),
        });
        const current = currentValue ?? 0;
        return {
          allowed: current < input.limit,
          remaining: Math.max(0, input.limit - current),
          reset: ttl > 0 ? Date.now() + ttl * 1000 : null,
        };
      },

      async increment(input) {
        const key = quotaKey(input);
        return executeAdapterOperation({
          provider: "upstash",
          fallbackMessage: "Upstash quota increment failed",
          secrets: [config.token],
          operation: async () => {
            const count = await redis.incr(key);
            if (count === 1) {
              await redis.expire(key, input.windowSeconds);
            }
            return count;
          },
        });
      },

      async remaining(input) {
        const current =
          (await executeAdapterOperation({
            provider: "upstash",
            fallbackMessage: "Upstash quota lookup failed",
            secrets: [config.token],
            operation: () => redis.get<number>(quotaKey(input)),
          })) ?? 0;
        return Math.max(0, input.limit - current);
      },
    },
  };
}
