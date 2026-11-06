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

vi.mock("better-auth/react", () => ({
  createAuthClient: () => mocks.client,
}));

vi.mock("@/lib/telemetry/identity", () => ({
  getClientTelemetryHeaders: () => ({}),
}));

import {
  signInWithEmail,
  signInWithGitHub,
  signInWithGoogle,
} from "@/lib/auth/client";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInEmail.mockResolvedValue({});
  mocks.signInSocial.mockResolvedValue({});
});

describe("default authentication destinations", () => {
  it("uses the shared destination for email sign-in", async () => {
    await signInWithEmail("person@example.com", "password");

    expect(mocks.signInEmail).toHaveBeenCalledWith({
      callbackURL: "/dashboard",
      email: "person@example.com",
      password: "password",
    });
  });

  it.each([
    ["GitHub", signInWithGitHub, "github"],
    ["Google", signInWithGoogle, "google"],
  ] as const)("uses the shared destination for %s OAuth", async (_, signIn, provider) => {
    await signIn();

    expect(mocks.signInSocial).toHaveBeenCalledWith({
      callbackURL: "/dashboard",
      provider,
    });
  });
});
