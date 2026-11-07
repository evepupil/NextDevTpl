/**
 * 支付配置
 *
 * 定义支付系统的全局配置和计划信息
 */

import {
  getPricingPlanFeatureLabels,
  PLAN_CATALOG,
} from "@/core/plans/catalog";
import { PLAN_IDS, type PlanId } from "@/core/plans/contracts";
import {
  type PaymentConfig,
  PaymentType,
  type Plan,
  type PlanConfig,
  PlanInterval,
  type PriceConfig,
  type PricingConfig,
} from "@/features/payment/types";

// ============================================
// 环境变量中的价格 ID
// ============================================

/**
 * 支付供应商产品/价格 ID（从环境变量读取）
 */
export const PRICE_IDS = {
  STARTER_MONTHLY: process.env.NEXT_PUBLIC_PRICE_STARTER_MONTHLY ?? "",
  STARTER_YEARLY: process.env.NEXT_PUBLIC_PRICE_STARTER_YEARLY ?? "",
  PRO_MONTHLY: process.env.NEXT_PUBLIC_PRICE_PRO_MONTHLY ?? "",
  PRO_YEARLY: process.env.NEXT_PUBLIC_PRICE_PRO_YEARLY ?? "",
  ULTRA_MONTHLY: process.env.NEXT_PUBLIC_PRICE_ULTRA_MONTHLY ?? "",
  ULTRA_YEARLY: process.env.NEXT_PUBLIC_PRICE_ULTRA_YEARLY ?? "",
} as const;

export const SUBSCRIPTION_MONTHLY_CREDITS = {
  starter: PLAN_CATALOG.plans.starter.monthlyCredits,
  pro: PLAN_CATALOG.plans.pro.monthlyCredits,
  ultra: PLAN_CATALOG.plans.ultra.monthlyCredits,
} as const;

const PLAN_PRICE_ID_KEYS = {
  starter: { month: "STARTER_MONTHLY", year: "STARTER_YEARLY" },
  pro: { month: "PRO_MONTHLY", year: "PRO_YEARLY" },
  ultra: { month: "ULTRA_MONTHLY", year: "ULTRA_YEARLY" },
} as const satisfies Record<
  Exclude<PlanId, "free">,
  Record<"month" | "year", keyof typeof PRICE_IDS>
>;

function createPlanConfig(planId: PlanId): PlanConfig {
  const plan = PLAN_CATALOG.plans[planId];
  if (planId === "free") return { id: planId, isFree: true };

  const priceIdKeys = PLAN_PRICE_ID_KEYS[planId];
  return {
    id: planId,
    ...("popular" in plan && plan.popular ? { popular: true } : {}),
    prices: [
      {
        type: PaymentType.SUBSCRIPTION,
        priceId: PRICE_IDS[priceIdKeys.month],
        amount: plan.prices.month,
        interval: PlanInterval.MONTH,
      },
      {
        type: PaymentType.SUBSCRIPTION,
        priceId: PRICE_IDS[priceIdKeys.year],
        amount: plan.prices.year,
        interval: PlanInterval.YEAR,
      },
    ],
  };
}

// ============================================
// 支付系统配置
// ============================================

/**
 * 支付系统全局配置
 */
export const paymentConfig: PaymentConfig = {
  /** 支付提供商 */
  provider: "creem",

  /** 货币 */
  currency: PLAN_CATALOG.currency,

  /** 年付折扣百分比（约等于送 5 个月） */
  yearlyDiscount: PLAN_CATALOG.yearlyDiscount,

  /** 支付完成后重定向 */
  redirectAfterCheckout: "/dashboard",

  /** 取消支付后重定向 */
  redirectAfterCancel: "/pricing",

  /** 计划配置 */
  plans: {
    free: createPlanConfig("free"),
    starter: createPlanConfig("starter"),
    pro: createPlanConfig("pro"),
    ultra: createPlanConfig("ultra"),
  },
};

// ============================================
// 计划显示信息
// ============================================

/**
 * 获取计划显示信息
 *
 * 返回用于定价页面展示的完整计划信息
 */
export function getPricingPlans(_t?: (key: string) => string): Plan[] {
  return PLAN_IDS.map((planId) => {
    const plan = PLAN_CATALOG.plans[planId];
    return {
      ...paymentConfig.plans[planId]!,
      name: plan.name,
      description: plan.description,
      features: getPricingPlanFeatureLabels(planId),
      cta: plan.cta,
    };
  });
}

/**
 * 获取定价页面完整配置
 */
export function getPricingConfig(): PricingConfig {
  return {
    title: "Simple, transparent pricing",
    subtitle: `Start free, upgrade when you need more. Save ${PLAN_CATALOG.yearlyDiscount}% with yearly billing.`,
    frequencies: ["Monthly", "Yearly"],
    yearlyDiscount: paymentConfig.yearlyDiscount,
    plans: getPricingPlans(),
  };
}

/**
 * 根据价格 ID 查找计划和价格信息
 */
export function findPlanByPriceId(priceId: string): {
  plan: Plan | null;
  price: PriceConfig | null;
} {
  const plans = getPricingPlans();

  for (const plan of plans) {
    if (plan.prices) {
      const price = plan.prices.find(
        (p) => p.priceId.length > 0 && p.priceId === priceId
      );
      if (price) {
        return { plan, price };
      }
    }
  }

  return { plan: null, price: null };
}

/**
 * 获取计划的价格（根据周期）
 */
export function getPlanPrice(
  plan: Plan,
  interval: PlanInterval
): PriceConfig | null {
  if (!plan.prices) return null;
  return plan.prices.find((p) => p.interval === interval) ?? null;
}

/**
 * 获取应用的基础 URL
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

/**
 * 只允许支付完成后回到本站，避免客户端把 Checkout 变成外部跳转器。
 */
export function getSafePaymentCallbackUrl(
  value: string | undefined,
  fallbackPath: string
): string {
  const baseUrl = getBaseUrl();
  const base = new URL(baseUrl);
  const fallback = new URL(fallbackPath, base);
  if (value === undefined) {
    return fallback.toString();
  }

  let candidate: URL;
  try {
    candidate = new URL(value, base);
  } catch {
    throw new Error("支付回调 URL 无效");
  }

  if (
    !["http:", "https:"].includes(candidate.protocol) ||
    candidate.origin !== base.origin ||
    candidate.username.length > 0 ||
    candidate.password.length > 0
  ) {
    throw new Error("支付回调 URL 必须指向本站");
  }

  return candidate.toString();
}
