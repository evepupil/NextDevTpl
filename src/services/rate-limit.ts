import {
  createUpstashServices,
  noopRateLimitAdapter,
  noopUsageQuotaAdapter,
} from "@/adapters/rate-limit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
const upstash = url && token ? createUpstashServices({ url, token }) : null;

export const rateLimitService = upstash?.rateLimit ?? noopRateLimitAdapter;
export const anonymousQuotaService = upstash?.quota ?? noopUsageQuotaAdapter;
