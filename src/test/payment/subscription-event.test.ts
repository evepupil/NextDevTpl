import { describe, expect, it } from "vitest";

import { isStaleSubscriptionEvent } from "@/features/payment";

describe("isStaleSubscriptionEvent", () => {
  const storedStart = new Date("2026-08-01T00:00:00.000Z");

  it("rejects an event from an older billing period", () => {
    expect(
      isStaleSubscriptionEvent(
        storedStart,
        new Date("2026-07-01T00:00:00.000Z")
      )
    ).toBe(true);
  });

  it("accepts the current or a newer billing period", () => {
    expect(isStaleSubscriptionEvent(storedStart, storedStart)).toBe(false);
    expect(
      isStaleSubscriptionEvent(
        storedStart,
        new Date("2026-09-01T00:00:00.000Z")
      )
    ).toBe(false);
  });

  it("does not reject events when a period start is unavailable", () => {
    expect(isStaleSubscriptionEvent(null, storedStart)).toBe(false);
    expect(isStaleSubscriptionEvent(storedStart, null)).toBe(false);
  });
});
