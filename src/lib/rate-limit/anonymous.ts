import { headers } from "next/headers";

import type { UsageQuotaInput } from "@/core/services";
import { anonymousQuotaService } from "@/services/rate-limit";

const ANONYMOUS_QUOTA = {
  maxGenerations: 2,
  namespace: "anonymous",
  windowSeconds: 24 * 60 * 60,
} as const;

let requestFingerprint: string | null = null;

export function setFingerprintForRequest(fingerprint: string): void {
  requestFingerprint = fingerprint;
}

export async function getClientIdentifier(): Promise<string> {
  try {
    if (requestFingerprint) {
      const fingerprint = requestFingerprint;
      requestFingerprint = null;
      return `fp:${fingerprint}`;
    }

    const headerList = await headers();
    const fingerprint = headerList.get("x-device-fingerprint");
    if (fingerprint) {
      return `fp:${fingerprint}`;
    }

    const ip =
      headerList.get("x-forwarded-for") ??
      headerList.get("x-real-ip") ??
      headerList.get("cf-connecting-ip") ??
      "unknown";
    return `ip:${ip.replace(/(\d+\.\d+\.\d+)\.\d+/, "$1.0")}`;
  } catch {
    return `unknown:${Date.now()}`;
  }
}

async function quotaInput(): Promise<UsageQuotaInput> {
  return {
    identifier: await getClientIdentifier(),
    limit: ANONYMOUS_QUOTA.maxGenerations,
    namespace: ANONYMOUS_QUOTA.namespace,
    windowSeconds: ANONYMOUS_QUOTA.windowSeconds,
  };
}

export async function checkAnonymousQuota(): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}> {
  try {
    const result = await anonymousQuotaService.check(await quotaInput());
    return {
      allowed: result.allowed,
      remaining: result.remaining,
      ...(result.reset === null ? {} : { resetAt: new Date(result.reset) }),
    };
  } catch (error) {
    console.error("Error checking quota:", error);
    return { allowed: true, remaining: ANONYMOUS_QUOTA.maxGenerations };
  }
}

export async function incrementAnonymousUsage(): Promise<number> {
  try {
    return await anonymousQuotaService.increment(await quotaInput());
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return 0;
  }
}

export async function getRemainingQuota(): Promise<number> {
  try {
    return await anonymousQuotaService.remaining(await quotaInput());
  } catch {
    return ANONYMOUS_QUOTA.maxGenerations;
  }
}
