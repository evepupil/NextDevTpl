// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const signInEmail = vi.fn();
  const signInSocial = vi.fn();
  const client = {
    getSession: vi.fn(),
    signIn: { email: signInEmail, social: signInSocial },
    signOut: vi.fn(),
    signUp: { email: vi.fn() },
    useSession: vi.fn(),
  };
  return { client, signInEmail, signInSocial };
});

vi.mock("@/config/auth-navigation", () => ({
  authNavigation: { afterSignIn: null, afterSignOut: "/sign-in" },
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: () => mocks.client,
}));

vi.mock("@/lib/telemetry/identity", () => ({
  getClientTelemetryHeaders: () => ({}),
}));

import { signInWithEmail, signInWithGoogle } from "@/lib/auth/client";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInEmail.mockResolvedValue({});
  mocks.signInSocial.mockResolvedValue({});
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/zh/sign-up?tab=account");
});

describe("auth-only authentication callbacks", () => {
  it("does not send a callback destination for email sign-in", async () => {
    await signInWithEmail("person@example.com", "password");

    expect(mocks.signInEmail).toHaveBeenCalledWith({
      email: "person@example.com",
      password: "password",
    });
  });

  it("returns OAuth to the current localized auth page with one-time state", async () => {
    await signInWithGoogle();

    const call = mocks.signInSocial.mock.calls[0]?.[0];
    const callbackURL = call?.callbackURL ?? "";
    const callbackUrl = new URL(callbackURL, window.location.origin);
    const state = callbackUrl.searchParams.get("oauthSuccess");

    expect(call?.provider).toBe("google");
    expect(callbackUrl.pathname).toBe("/zh/sign-up");
    expect(callbackUrl.searchParams.get("tab")).toBeNull();
    expect(state).toMatch(/^[a-f0-9]{32}$/u);
    expect(
      window.sessionStorage.getItem("nextdevtpl:oauth-success-state")
    ).toBe(state);
  });
});
