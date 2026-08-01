import { describe, expect, it } from "vitest";

import {
  calculateAIGrossMargin,
  estimateAICost,
  usageCoverageStatus,
} from "@/features/operations";

describe("AI usage and cost metrics", () => {
  it("estimates token cost from the price version active at request time", () => {
    expect(
      estimateAICost({
        model: "gpt-4o-mini",
        provider: "openai-compatible",
        occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        usage: {
          inputTokens: 1_000_000,
          outputTokens: 500_000,
          status: "actual",
          totalTokens: 1_500_000,
        },
      })
    ).toMatchObject({
      amountMinor: 45,
      currency: "USD",
      status: "estimated",
    });
  });

  it("marks missing prices and usage as unavailable", () => {
    expect(
      estimateAICost({
        model: "unknown-model",
        provider: "workers-ai",
        usage: {
          inputTokens: null,
          outputTokens: null,
          status: "unavailable",
          totalTokens: null,
        },
      }).status
    ).toBe("unavailable");
    expect(usageCoverageStatus(["actual", "estimated", "unavailable"])).toBe(
      33.33
    );
  });

  it("calculates operating margin without claiming accounting profit", () => {
    expect(
      calculateAIGrossMargin({ costMinor: 25, revenueMinor: 100 })
    ).toEqual({ marginMinor: 75, rate: 75 });
    expect(calculateAIGrossMargin({ costMinor: 25, revenueMinor: 0 })).toEqual({
      marginMinor: -25,
      rate: null,
    });
  });
});
