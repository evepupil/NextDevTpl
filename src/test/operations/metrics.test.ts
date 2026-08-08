import { describe, expect, it } from "vitest";

import {
  createFunnel,
  createHealth,
  createRetention,
  getOperationsPeriod,
  ratioMetric,
} from "@/features/operations";

describe("operations metric contracts", () => {
  it("calculates percentages with stable two-decimal precision", () => {
    expect(ratioMetric(1, 3, "test")).toEqual({
      source: "test",
      status: "ready",
      value: 33.33,
    });
  });

  it("marks empty denominators as zero-data", () => {
    expect(ratioMetric(0, 0, "test").status).toBe("zero-data");
  });

  it("keeps unsupported analytics metrics explicit", () => {
    const funnel = createFunnel({ paidUsers: 2, registeredUsers: 4 });
    expect(funnel.landingVisitors.status).toBe("not-configured");
    expect(funnel.registeredUsers.value).toBe(4);
    expect(createRetention().d7.status).toBe("not-configured");
    expect(createHealth().apiSuccessRate.status).toBe("not-configured");
  });

  it("uses local-day boundaries for the configured timezone", () => {
    const period = getOperationsPeriod({
      now: new Date("2026-08-02T18:30:00.000Z"),
      timezone: "Asia/Shanghai",
    });
    expect(period.start.toISOString()).toBe("2026-07-03T16:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-08-02T16:00:00.000Z");
    expect(period.timezone).toBe("Asia/Shanghai");
  });

  it("falls back to UTC for an invalid timezone", () => {
    const period = getOperationsPeriod({
      now: new Date("2026-08-02T18:30:00.000Z"),
      timezone: "not/a-timezone",
    });

    expect(period.timezone).toBe("UTC");
    expect(period.end.toISOString()).toBe("2026-08-02T00:00:00.000Z");
  });
});
