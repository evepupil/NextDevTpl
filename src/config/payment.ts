/**
 * 支付配置
 *
 * 定义支付系统的全局配置和计划信息
 */

import {
  PaymentType,
  PlanInterval,
  type PaymentConfig,
  type Plan,
  type PriceConfig,
  type PricingConfig,
} from "@/features/payment/types";

// ============================================
// 环境变量中的价格 ID
// ============================================

/**
 * Stripe 价格 ID（从环境变量读取）
 */
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "",
  PRO_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? "",
  LIFETIME: process.env.NEXT_PUBLIC_STRIPE_PRICE_LIFETIME ?? "",
  ENTERPRISE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY ?? "",
  ENTERPRISE_YEARLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_YEARLY ?? "",
} as const;

// ============================================
// 支付系统配置
// ============================================

/**
 * 支付系统全局配置
 */
export const paymentConfig: PaymentConfig = {
  /** 支付提供商 */
  provider: "stripe",

  /** 货币 */
  currency: "USD",

  /** 年付折扣百分比 */
  yearlyDiscount: 20,

  /** 支付完成后重定向 */
  redirectAfterCheckout: "/dashboard",

  /** 取消支付后重定向 */
  redirectAfterCancel: "/pricing",

  /** 计划配置 */
  plans: {
    // 免费计划
    free: {
      id: "free",
      isFree: true,
    },

    // Pro 计划（订阅）
    pro: {
      id: "pro",
      popular: true,
      prices: [
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
          amount: 29,
          interval: PlanInterval.MONTH,
          trialPeriodDays: 7,
        },
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: STRIPE_PRICE_IDS.PRO_YEARLY,
          amount: 290,
          interval: PlanInterval.YEAR,
          trialPeriodDays: 14,
        },
      ],
    },

    // 终身计划（一次性购买）
    lifetime: {
      id: "lifetime",
      isLifetime: true,
      prices: [
        {
          type: PaymentType.ONE_TIME,
          priceId: STRIPE_PRICE_IDS.LIFETIME,
          amount: 299,
        },
      ],
    },

    // 企业计划
    enterprise: {
      id: "enterprise",
      isEnterprise: true,
      highlighted: true,
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
 * 可以通过传入翻译函数实现国际化
 */
export function getPricingPlans(
  _t?: (key: string) => string
): Plan[] {
  const plans: Plan[] = [];
  const config = paymentConfig;

  // 免费计划
  if (config.plans.free) {
    plans.push({
      ...config.plans.free,
      name: "Starter",
      description: "Perfect for side projects",
      features: [
        "Up to 3 projects",
        "Basic analytics",
        "Community support",
        "1GB storage",
      ],
      cta: "Get Started",
    });
  }

  // Pro 计划
  if (config.plans.pro) {
    plans.push({
      ...config.plans.pro,
      name: "Pro",
      description: "For growing businesses",
      features: [
        "Unlimited projects",
        "Advanced analytics",
        "Priority support",
        "10GB storage",
        "Custom domain",
        "API access",
      ],
      cta: "Start Free Trial",
    });
  }

  // 终身计划
  if (config.plans.lifetime) {
    plans.push({
      ...config.plans.lifetime,
      name: "Lifetime",
      description: "Pay once, use forever",
      features: [
        "Everything in Pro",
        "Lifetime updates",
        "Source code access",
        "Private Discord",
        "1-on-1 onboarding",
      ],
      cta: "Buy Now",
    });
  }

  // 企业计划
  if (config.plans.enterprise) {
    plans.push({
      ...config.plans.enterprise,
      name: "Enterprise",
      description: "For large organizations",
      features: [
        "Everything in Lifetime",
        "Custom integrations",
        "SLA guarantee",
        "Dedicated support",
        "On-premise option",
        "Security audit",
      ],
      cta: "Contact Sales",
      dark: true,
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
    subtitle: "Choose the plan that works best for you. All plans include a 14-day free trial.",
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

  // 终身计划没有周期
  if (plan.isLifetime) {
    return plan.prices[0] ?? null;
  }

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
