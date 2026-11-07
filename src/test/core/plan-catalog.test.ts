import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import {
  getPricingConfig,
  getPricingPlans,
  paymentConfig,
  SUBSCRIPTION_MONTHLY_CREDITS,
} from "@/config/payment";
import {
  formatFileSizeLimit,
  isWithinFileSizeLimit,
  PLAN_PRIVILEGES,
} from "@/config/subscription-plan";
import {
  getPricingPlanFeatureLabels,
  PLAN_CATALOG,
} from "@/core/plans/catalog";
import { PLAN_IDS } from "@/core/plans/contracts";

describe("共用套餐配置迁移", () => {
  it("四档套餐的价格、额度、大小和队列权益保持", () => {
    expect(PLAN_IDS).toEqual(["free", "starter", "pro", "ultra"]);
    expect(
      PLAN_IDS.map((id) => {
        const plan = PLAN_CATALOG.plans[id];
        return [
          id,
          plan.prices.month,
          plan.prices.year,
          plan.monthlyCredits,
          plan.maxFileSizeBytes / (1024 * 1024),
          plan.queuePriority,
        ];
      })
    ).toEqual([
      ["free", 0, 0, 200, 5, "normal"],
      ["starter", 5, 35, 3000, 20, "normal"],
      ["pro", 9, 65, 8000, 50, "priority"],
      ["ultra", 15, 109, 16000, 100, "highest"],
    ]);
    expect(PLAN_CATALOG.currency).toBe("USD");
    expect(PLAN_CATALOG.yearlyDiscount).toBe(40);
    expect(
      PLAN_IDS.filter((id) => {
        const plan = PLAN_CATALOG.plans[id];
        return "popular" in plan && plan.popular;
      })
    ).toEqual(["pro"]);
  });

  it("真实支付显示与权限检查从共用目录派生", () => {
    const plans = getPricingPlans();
    expect(plans.map((plan) => plan.id)).toEqual(PLAN_IDS);
    for (const id of PLAN_IDS) {
      const core = PLAN_CATALOG.plans[id];
      const plan = plans.find((item) => item.id === id);
      expect(plan?.name).toBe(core.name);
      expect(plan?.features).toEqual(getPricingPlanFeatureLabels(id));
      expect(PLAN_PRIVILEGES[id]).toEqual({
        name: core.name,
        monthlyCredits: core.monthlyCredits,
        maxFileSizeBytes: core.maxFileSizeBytes,
        queuePriority: core.queuePriority,
      });
      expect(isWithinFileSizeLimit(id, core.maxFileSizeBytes)).toBe(true);
      expect(isWithinFileSizeLimit(id, core.maxFileSizeBytes + 1)).toBe(false);
      expect(formatFileSizeLimit(id)).toBe(
        `${core.maxFileSizeBytes / (1024 * 1024)}MB`
      );
      if (id !== "free") {
        expect(plan?.prices?.map((price) => price.amount)).toEqual([
          core.prices.month,
          core.prices.year,
        ]);
        expect(SUBSCRIPTION_MONTHLY_CREDITS[id]).toBe(core.monthlyCredits);
      }
    }
    expect(paymentConfig.currency).toBe(PLAN_CATALOG.currency);
    expect(getPricingConfig().yearlyDiscount).toBe(PLAN_CATALOG.yearlyDiscount);
    expect(getPricingConfig().plans).toEqual(plans);
  });

  it("原英文公开显示保留一次性免费额度与各档具体权益", () => {
    expect(getPricingPlanFeatureLabels("free")).toEqual([
      "200 credits (one-time)",
      "Text & file input",
      "Up to 10K characters per task",
      "Max 5MB file size",
      "Export to Anki & Markdown",
      "Deck history saved forever",
    ]);
    expect(getPricingPlanFeatureLabels("starter")[0]).toBe(
      "3,000 credits / month"
    );
    expect(getPricingPlanFeatureLabels("pro")).toContain(
      "Priority generation queue"
    );
    expect(getPricingPlanFeatureLabels("ultra")).toContain(
      "Highest priority queue"
    );
    expect(PLAN_CATALOG.plans.free.featureKeys).not.toContain("queue");
    expect(PLAN_CATALOG.plans.pro.featureKeys).toContain("customCards");
    expect(PLAN_CATALOG.plans.ultra.featureKeys).toContain("aiAssist");
  });

  it("纯套餐目录无需环境变量、支付 SDK 或供应商价格编号", async () => {
    const source = await readFile("src/core/plans/catalog.ts", "utf8");
    expect(source).not.toMatch(
      /process\.env|PRICE_IDS|@\/|from ["'](?:creem|stripe|better-auth)/
    );
    expect(JSON.stringify(PLAN_CATALOG)).not.toMatch(
      /priceId|provider|checkout/i
    );
  });
});
