import type { NextRequest } from "next/server";

import type { RateLimitDecision } from "@/core/services";
import { rateLimitService } from "@/services/rate-limit";

export const RateLimitConfig = {
  global: { requests: 100, window: "1m" as const },
  auth: { requests: 5, window: "1m" as const },
  ai: { requests: 20, window: "1m" as const },
  payment: { requests: 10, window: "1m" as const },
  upload: { requests: 30, window: "1m" as const },
  strict: { requests: 3, window: "1m" as const },
} as const;

export type RateLimitType = keyof typeof RateLimitConfig;
export type RateLimitResult = RateLimitDecision;

export function isRateLimitEnabled(): boolean {
  return rateLimitService.provider !== "noop";
}

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "global"
): Promise<RateLimitResult> {
  const config = RateLimitConfig[type];
  return rateLimitService.limit({
    identifier,
    namespace: type,
    limit: config.requests,
    window: config.window,
  });
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  if (result.skipped) {
    return {};
  }

  return {
    ...(result.limit === null
      ? {}
      : { "X-RateLimit-Limit": String(result.limit) }),
    ...(result.remaining === null
      ? {}
      : { "X-RateLimit-Remaining": String(result.remaining) }),
    ...(result.reset === null
      ? {}
      : { "X-RateLimit-Reset": String(result.reset) }),
  };
}

export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter =
    result.reset === null
      ? 60
      : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "请求过于频繁，请稍后再试",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        ...getRateLimitHeaders(result),
      },
    }
  );
}

export interface WithRateLimitOptions {
  type?: RateLimitType;
  getIdentifier?: (request: NextRequest) => string | Promise<string>;
}

export async function withRateLimit<T extends Response>(
  request: NextRequest,
  options: WithRateLimitOptions,
  handler: () => Promise<T>
): Promise<T | Response> {
  const { type = "global", getIdentifier = getClientIp } = options;
  const result = await checkRateLimit(await getIdentifier(request), type);

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  const response = await handler();
  const headers = getRateLimitHeaders(result);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
