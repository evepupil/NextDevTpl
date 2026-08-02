import { describe, expect, it } from "vitest";

import {
  compareSubscriptionPrices,
  resolveIncomingSubscriptionPrice,
} from "@/features/payment";
import { PlanInterval } from "@/features/payment/types";

describe("subscription price changes", () => {
  it("classifies plan rank changes", () => {
    expect(
      compareSubscriptionPrices({
        currentAmount: 5,
        currentInterval: PlanInterval.MONTH,
        currentPlanId: "starter",
        targetAmount: 9,
        targetInterval: PlanInterval.MONTH,
        targetPlanId: "pro",
      })
    ).toBe("upgrade");

    expect(
      compareSubscriptionPrices({
        currentAmount: 15,
        currentInterval: PlanInterval.MONTH,
        currentPlanId: "ultra",
        targetAmount: 9,
        targetInterval: PlanInterval.MONTH,
        targetPlanId: "pro",
      })
    ).toBe("downgrade");
  });

  it("treats a same-plan annual switch as an upgrade and the reverse as a downgrade", () => {
    expect(
      compareSubscriptionPrices({
        currentAmount: 5,
        currentInterval: PlanInterval.MONTH,
        currentPlanId: "starter",
        targetAmount: 35,
        targetInterval: PlanInterval.YEAR,
        targetPlanId: "starter",
      })
    ).toBe("upgrade");

    expect(
      compareSubscriptionPrices({
        currentAmount: 35,
        currentInterval: PlanInterval.YEAR,
        currentPlanId: "starter",
        targetAmount: 5,
        targetInterval: PlanInterval.MONTH,
        targetPlanId: "starter",
      })
    ).toBe("downgrade");
  });

  it("returns unchanged for the same effective price", () => {
    expect(
      compareSubscriptionPrices({
        currentAmount: 9,
        currentInterval: PlanInterval.MONTH,
        currentPlanId: "pro",
        targetAmount: 9,
        targetInterval: PlanInterval.MONTH,
        targetPlanId: "pro",
      })
    ).toBe("unchanged");
  });
});

describe("incoming subscription price resolution", () => {
  const currentPeriodStart = new Date("2026-08-01T00:00:00.000Z");
  const currentPeriodEnd = new Date("2026-09-01T00:00:00.000Z");

  it("keeps the current price when a provider update arrives in the current period", () => {
    expect(
      resolveIncomingSubscriptionPrice({
        currentPeriodEnd,
        currentPeriodStart,
        currentPriceId: "price_pro_monthly",
        incomingPeriodStart: currentPeriodStart,
        incomingPriceId: "price_starter_monthly",
        pendingPriceEffectiveAt: currentPeriodEnd,
        pendingPriceId: "price_starter_monthly",
      })
    ).toEqual({
      appliedPendingPrice: false,
      pendingPriceEffectiveAt: currentPeriodEnd,
      pendingPriceId: "price_starter_monthly",
      priceId: "price_pro_monthly",
    });
  });

  it("applies a pending price when the next period starts", () => {
    expect(
      resolveIncomingSubscriptionPrice({
        currentPeriodEnd,
        currentPeriodStart,
        currentPriceId: "price_pro_monthly",
        incomingPeriodStart: currentPeriodEnd,
        incomingPriceId: "price_starter_monthly",
        pendingPriceEffectiveAt: currentPeriodEnd,
        pendingPriceId: "price_starter_monthly",
      })
    ).toEqual({
      appliedPendingPrice: true,
      pendingPriceEffectiveAt: null,
      pendingPriceId: null,
      priceId: "price_starter_monthly",
    });
  });

  it("uses the incoming price when no pending change exists", () => {
    expect(
      resolveIncomingSubscriptionPrice({
        currentPeriodEnd,
        currentPeriodStart,
        currentPriceId: "price_pro_monthly",
        incomingPeriodStart: currentPeriodEnd,
        incomingPriceId: "price_ultra_monthly",
        pendingPriceEffectiveAt: null,
        pendingPriceId: null,
      })
    ).toMatchObject({
      appliedPendingPrice: false,
      priceId: "price_ultra_monthly",
    });
  });
});
