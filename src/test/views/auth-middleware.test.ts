import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authNavigation: {
    afterSignIn: null as string | null,
    afterSignOut: "/sign-in",
  },
  intlMiddleware: vi.fn(),
  nextResponse: new Response(null, { status: 200 }),
  redirect: vi.fn(),
  redirectResponse: new Response(null, { status: 307 }),
}));

vi.mock("@/config/auth-navigation", () => ({
  authNavigation: mocks.authNavigation,
}));

vi.mock("@/i18n/routing", () => ({
  routing: { defaultLocale: "en", locales: ["en", "zh"] },
}));

vi.mock("@/lib/auth/edge", () => ({
  authRoutes: ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"],
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
  createRateLimitResponse: vi.fn(),
  getClientIp: vi.fn(),
  getRateLimitHeaders: vi.fn(),
}));

vi.mock("next-intl/middleware", () => ({
  default: () => mocks.intlMiddleware,
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: () => mocks.nextResponse,
    redirect: (url: URL) => {
      mocks.redirect(url);
      return mocks.redirectResponse;
    },
  },
}));

import { middleware } from "@/middleware";

function createRequest(pathname: string, sessionToken?: string): NextRequest {
  const url = new URL(`https://app.test${pathname}`);
  return {
    cookies: {
      get(name: string) {
        return name === "better-auth.session_token" && sessionToken
          ? { value: sessionToken }
          : undefined;
      },
    },
    nextUrl: url,
    url: url.href,
  } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authNavigation.afterSignIn = null;
  mocks.intlMiddleware.mockResolvedValue(mocks.nextResponse);
});

describe("auth middleware destinations", () => {
  it("keeps an authenticated user on the auth page when no destination exists", async () => {
    const request = createRequest("/zh/sign-in", "session-token");

    const response = await middleware(request);

    expect(response).toBe(mocks.nextResponse);
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.intlMiddleware).toHaveBeenCalledWith(request);
  });

  it("redirects an authenticated user to the configured localized destination", async () => {
    mocks.authNavigation.afterSignIn = "/dashboard";

    await middleware(createRequest("/zh/sign-up", "session-token"));

    expect(mocks.redirect).toHaveBeenCalledWith(
      new URL("https://app.test/zh/dashboard")
    );
    expect(mocks.intlMiddleware).not.toHaveBeenCalled();
  });

  it("keeps the protected-route session check when no destination exists", async () => {
    await middleware(createRequest("/zh/dashboard"));

    const redirectUrl = mocks.redirect.mock.calls[0]?.[0] as URL | undefined;
    expect(redirectUrl?.pathname).toBe("/zh/sign-in");
    expect(redirectUrl?.searchParams.get("callbackUrl")).toBe("/zh/dashboard");
  });
});
