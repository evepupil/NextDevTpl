import { describe, expect, it } from "vitest";

import { buildRevenueHealth, calculateMrrMinor } from "@/features/operations";
import { PlanInterval } from "@/features/payment";

describe("revenue operations metrics", () => {
  it("converts monthly and yearly prices to minor-unit MRR", () => {
    expect(calculateMrrMinor({ amount: 9, interval: PlanInterval.MONTH })).toBe(
      900
    );
    expect(
      calculateMrrMinor({ amount: 120, interval: PlanInterval.YEAR })
    ).toBe(1000);
  });

  it("keeps monetary values in minor units and marks empty sources", () => {
    const health = buildRevenueHealth({
      activeMrrMinor: 1000,
      confirmedRevenueEvents: 2,
      confirmedRevenueMinor: 1800,
      currency: "USD",
      churnedSubscriptions: 1,
      paidUsers: 1,
      paymentFailures: 2,
      refundsMinor: 300,
      refundEvents: 1,
      registeredUsers: 2,
    });

    expect(health.confirmedRevenueMinor.value).toBe(1800);
    expect(health.refundsMinor.value).toBe(300);
    expect(health.paidConversionRate.value).toBe(50);
    expect(health.currency).toBe("USD");

    const empty = buildRevenueHealth({
      activeMrrMinor: 0,
      confirmedRevenueEvents: 0,
      confirmedRevenueMinor: 0,
      currency: "USD",
      churnedSubscriptions: 0,
      paidUsers: 0,
      paymentFailures: 0,
      refundsMinor: 0,
      refundEvents: 0,
      registeredUsers: 0,
    });
    expect(empty.mrrMinor.status).toBe("zero-data");
    expect(empty.confirmedRevenueMinor.status).toBe("zero-data");
  });
});
