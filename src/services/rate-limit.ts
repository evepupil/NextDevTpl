import {
  createUpstashServices,
  noopRateLimitAdapter,
  noopUsageQuotaAdapter,
} from "@/adapters/rate-limit";
import { getRuntimeEnv } from "@/lib/runtime-config";

const url = getRuntimeEnv("UPSTASH_REDIS_REST_URL");
const token = getRuntimeEnv("UPSTASH_REDIS_REST_TOKEN");
const upstash = url && token ? createUpstashServices({ url, token }) : null;

export const rateLimitService = upstash?.rateLimit ?? noopRateLimitAdapter;
export const anonymousQuotaService = upstash?.quota ?? noopUsageQuotaAdapter;
