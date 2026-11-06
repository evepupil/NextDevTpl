import { describe, expect, it } from "vitest";
import { resolveSubscriptionActionOutcome } from "@/features/settings/utils";

describe("resolveSubscriptionActionOutcome", () => {
  it("accepts an explicitly successful result", () => {
    expect(
      resolveSubscriptionActionOutcome({ data: { success: true } })
    ).toEqual({ ok: true });
  });

  it("gives server errors precedence", () => {
    expect(resolveSubscriptionActionOutcome({ serverError: "x" })).toEqual({
      ok: false,
      reason: "server-error",
    });
    expect(
      resolveSubscriptionActionOutcome({
        data: { success: true },
        serverError: "x",
      })
    ).toEqual({ ok: false, reason: "server-error" });
  });

  it("returns validation-error when validation errors are present", () => {
    expect(
      resolveSubscriptionActionOutcome({
        validationErrors: { a: ["x"] },
      })
    ).toEqual({ ok: false, reason: "validation-error" });
  });

  it("does not confirm a false success value", () => {
    expect(
      resolveSubscriptionActionOutcome({ data: { success: false } })
    ).toEqual({ ok: false, reason: "not-confirmed" });
  });

  it("does not confirm null data", () => {
    expect(resolveSubscriptionActionOutcome({ data: null })).toEqual({
      ok: false,
      reason: "not-confirmed",
    });
  });

  it("does not confirm an empty result", () => {
    expect(resolveSubscriptionActionOutcome({})).toEqual({
      ok: false,
      reason: "not-confirmed",
    });
  });

  it("does not confirm an undefined result", () => {
    expect(resolveSubscriptionActionOutcome(undefined)).toEqual({
      ok: false,
      reason: "not-confirmed",
    });
  });

  it("does not confirm a null result", () => {
    expect(resolveSubscriptionActionOutcome(null)).toEqual({
      ok: false,
      reason: "not-confirmed",
    });
  });
});
