import type { TelemetryContext } from "@/core/services";

import {
  getTelemetryContextFromRequest,
  type TelemetryRequestContext,
} from "./identity";

export type AuthMethod = "email" | "social" | "unknown";

export function getAuthMethod(path: string | undefined): AuthMethod {
  if (!path) return "unknown";
  if (path.includes("social") || path.includes("callback")) return "social";
  if (path.includes("email")) return "email";
  return "unknown";
}

export function isSignupPath(path: string | undefined): boolean {
  return Boolean(
    path &&
      (path.startsWith("/sign-up/") ||
        path.startsWith("/sign-in/social") ||
        path.startsWith("/callback/") ||
        path.startsWith("/oauth2/callback/"))
  );
}

export function isLoginPath(path: string | undefined): boolean {
  return Boolean(
    path &&
      (path.startsWith("/sign-in/") ||
        path.startsWith("/callback/") ||
        path.startsWith("/oauth2/callback/"))
  );
}

export function createAuthTelemetryContext(
  request: TelemetryRequestContext,
  identity: { sessionId?: string; userId?: string }
): TelemetryContext {
  return getTelemetryContextFromRequest(request, identity);
}

export function createAuthLifecycleTracker() {
  const signupContexts = new WeakSet<object>();

  return {
    isSignupContext(context: unknown): boolean {
      return typeof context === "object" && context !== null
        ? signupContexts.has(context)
        : false;
    },
    markSignupContext(context: unknown): void {
      if (typeof context === "object" && context !== null) {
        signupContexts.add(context);
      }
    },
  };
}
