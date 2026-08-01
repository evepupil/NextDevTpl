import { describe, expect, it } from "vitest";

import {
  createAuthLifecycleTracker,
  getAuthMethod,
  isLoginPath,
  isSignupPath,
} from "@/lib/telemetry/auth";

describe("auth telemetry lifecycle", () => {
  it("distinguishes email and social auth endpoints", () => {
    expect(getAuthMethod("/sign-up/email")).toBe("email");
    expect(getAuthMethod("/sign-in/social")).toBe("social");
    expect(getAuthMethod("/callback/google")).toBe("social");
    expect(getAuthMethod("/get-session")).toBe("unknown");
    expect(isSignupPath("/sign-up/email")).toBe(true);
    expect(isSignupPath("/sign-in/social")).toBe(true);
    expect(isLoginPath("/sign-in/email")).toBe(true);
    expect(isLoginPath("/get-session")).toBe(false);
  });

  it("marks only the request context that created a user", () => {
    const tracker = createAuthLifecycleTracker();
    const signupContext = {};
    const loginContext = {};

    expect(tracker.isSignupContext(signupContext)).toBe(false);
    tracker.markSignupContext(signupContext);
    expect(tracker.isSignupContext(signupContext)).toBe(true);
    expect(tracker.isSignupContext(loginContext)).toBe(false);
    expect(tracker.isSignupContext(null)).toBe(false);
  });
});
