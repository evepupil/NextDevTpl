/**
 * 支付配置
 *
 * 定义支付系统的全局配置和计划信息
 */

import {
  type PaymentConfig,
  PaymentType,
  type Plan,
  PlanInterval,
  type PriceConfig,
  type PricingConfig,
} from "@/features/payment/types";

// ============================================
// 环境变量中的价格 ID
// ============================================

/**
 * Creem 产品/价格 ID（从环境变量读取）
 */
export const PRICE_IDS = {
  STARTER_MONTHLY: process.env.NEXT_PUBLIC_CREEM_PRICE_STARTER_MONTHLY ?? "",
  STARTER_YEARLY: process.env.NEXT_PUBLIC_CREEM_PRICE_STARTER_YEARLY ?? "",
  PRO_MONTHLY: process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_MONTHLY ?? "",
  PRO_YEARLY: process.env.NEXT_PUBLIC_CREEM_PRICE_PRO_YEARLY ?? "",
  ULTRA_MONTHLY: process.env.NEXT_PUBLIC_CREEM_PRICE_ULTRA_MONTHLY ?? "",
  ULTRA_YEARLY: process.env.NEXT_PUBLIC_CREEM_PRICE_ULTRA_YEARLY ?? "",
} as const;

// ============================================
// 订阅积分配额（每月）
// ============================================

export const SUBSCRIPTION_MONTHLY_CREDITS = {
  starter: 3000,
  pro: 8000,
  ultra: 16000,
} as const;

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
  currency: "USD",

  /** 年付折扣百分比（约等于送 5 个月） */
  yearlyDiscount: 40,

  /** 支付完成后重定向 */
  redirectAfterCheckout: "/dashboard",

  /** 取消支付后重定向 */
  redirectAfterCancel: "/pricing",

  /** 计划配置 */
  plans: {
    free: {
      id: "free",
      isFree: true,
    },

    starter: {
      id: "starter",
      prices: [
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: PRICE_IDS.STARTER_MONTHLY,
          amount: 5,
          interval: PlanInterval.MONTH,
        },
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: PRICE_IDS.STARTER_YEARLY,
          amount: 35,
          interval: PlanInterval.YEAR,
        },
      ],
    },

    pro: {
      id: "pro",
      popular: true,
      prices: [
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: PRICE_IDS.PRO_MONTHLY,
          amount: 9,
          interval: PlanInterval.MONTH,
        },
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: PRICE_IDS.PRO_YEARLY,
          amount: 65,
          interval: PlanInterval.YEAR,
        },
      ],
    },

    ultra: {
      id: "ultra",
      prices: [
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: PRICE_IDS.ULTRA_MONTHLY,
          amount: 15,
          interval: PlanInterval.MONTH,
        },
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: PRICE_IDS.ULTRA_YEARLY,
          amount: 109,
          interval: PlanInterval.YEAR,
        },
      ],
    },
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
  const plans: Plan[] = [];
  const config = paymentConfig;

  // 免费计划
  if (config.plans.free) {
    plans.push({
      ...config.plans.free,
      name: "Free",
      description: "Try NextDevTpl with no commitment",
      features: [
        "200 credits (one-time)",
        "Text & file input",
        "Up to 10K characters per task",
        "Max 5MB file size",
        "Export to Anki & Markdown",
        "Deck history saved forever",
      ],
      cta: "Get Started",
    });
  }

  // Starter 计划
  if (config.plans.starter) {
    plans.push({
      ...config.plans.starter,
      name: "Starter",
      description: "For casual learners",
      features: [
        "3,000 credits / month",
        "Text & file input",
        "Up to 100K characters per task",
        "Max 20MB file size",
        "Export to Anki & Markdown",
        "Deck history saved forever",
        "Email support",
      ],
      cta: "Subscribe",
    });
  }

  // Pro 计划
  if (config.plans.pro) {
    plans.push({
      ...config.plans.pro,
      name: "Pro",
      description: "For serious learners",
      features: [
        "8,000 credits / month",
        "All input sources (URL, video, etc.)",
        "Up to 300K characters per task",
        "Max 50MB file size",
        "Priority generation queue",
        "Export to Anki & Markdown",
        "Deck history saved forever",
        "🚧 Custom card styles (coming soon)",
        "Priority support",
      ],
      cta: "Subscribe",
    });
  }

  // Ultra 计划
  if (config.plans.ultra) {
    plans.push({
      ...config.plans.ultra,
      name: "Ultra",
      description: "For power users & educators",
      features: [
        "16,000 credits / month",
        "All input sources (URL, video, etc.)",
        "Up to 1M characters per task",
        "Max 100MB file size",
        "Highest priority queue",
        "Export to Anki & Markdown",
        "Deck history saved forever",
        "🚧 Custom card styles (coming soon)",
        "🚧 AI-assisted card making (coming soon)",
        "Dedicated support",
      ],
      cta: "Subscribe",
    });
  }

  return plans;
}

/**
 * 获取定价页面完整配置
 */
export function getPricingConfig(): PricingConfig {
  return {
    title: "Simple, transparent pricing",
    subtitle:
      "Start free, upgrade when you need more. Save 40% with yearly billing.",
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
      const price = plan.prices.find((p) => p.priceId === priceId);
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
