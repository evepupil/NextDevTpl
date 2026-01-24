"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import {
  createCheckoutSession,
  createCustomerPortal,
} from "@/payment/actions";
import { STRIPE_PRICE_IDS } from "@/payment/config";

/**
 * 价格计划配置
 */
const plans = [
  {
    name: "Starter",
    description: "Perfect for side projects",
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyPriceId: null,
    yearlyPriceId: null,
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1GB storage",
    ],
    cta: "Get Started",
    highlighted: false,
    dark: false,
  },
  {
    name: "Pro",
    description: "For growing businesses",
    monthlyPrice: 29,
    yearlyPrice: 290,
    monthlyPriceId: STRIPE_PRICE_IDS.PRO_MONTHLY,
    yearlyPriceId: STRIPE_PRICE_IDS.PRO_YEARLY,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "10GB storage",
      "Custom domain",
      "API access",
    ],
    cta: "Start Free Trial",
    highlighted: true,
    dark: false,
  },
  {
    name: "Lifetime",
    description: "Pay once, use forever",
    monthlyPrice: 299,
    yearlyPrice: 299,
    monthlyPriceId: null,
    yearlyPriceId: null,
    isLifetime: true,
    features: [
      "Everything in Pro",
      "Lifetime updates",
      "Source code access",
      "Private Discord",
      "1-on-1 onboarding",
    ],
    cta: "Buy Now",
    highlighted: false,
    dark: false,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    monthlyPrice: null,
    yearlyPrice: null,
    monthlyPriceId: STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY,
    yearlyPriceId: STRIPE_PRICE_IDS.ENTERPRISE_YEARLY,
    features: [
      "Everything in Lifetime",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated support",
      "On-premise option",
      "Security audit",
    ],
    cta: "Contact Sales",
    highlighted: false,
    dark: true,
  },
];

/**
 * 价格计划组件属性
 */
interface PricingSectionProps {
  /** 用户当前订阅的价格 ID */
  currentPriceId?: string | null;
}

/**
 * 价格计划展示组件
 *
 * 功能:
 * - 展示不同的订阅计划
 * - 支持月付/年付切换
 * - 集成 Stripe Checkout
 * - 已订阅用户显示管理订阅按钮
 */
export function PricingSection({ currentPriceId }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  /**
   * 处理订阅按钮点击
   */
  const handleSubscribe = async (plan: (typeof plans)[number]) => {
    // 如果是 Enterprise 计划，跳转到联系页面
    if (plan.name === "Enterprise") {
      router.push("/contact");
      return;
    }

    // 如果是免费计划或 Lifetime 计划，暂不处理
    if (!plan.monthlyPriceId && !plan.yearlyPriceId) {
      if (plan.name === "Starter") {
        router.push("/sign-up");
      }
      return;
    }

    // 如果用户未登录，跳转到登录页面
    if (!session?.user) {
      router.push("/sign-in?redirect=/pricing");
      return;
    }

    // 获取对应的价格 ID
    const priceId = isYearly ? plan.yearlyPriceId : plan.monthlyPriceId;
    if (!priceId) return;

    setLoadingPlan(plan.name);

    startTransition(async () => {
      try {
        const result = await createCheckoutSession({ priceId });
        if (result?.data?.url) {
          window.location.href = result.data.url;
        }
      } catch (error) {
        console.error("Failed to create checkout session:", error);
      } finally {
        setLoadingPlan(null);
      }
    });
  };

  /**
   * 处理管理订阅按钮点击
   */
  const handleManageSubscription = () => {
    startTransition(async () => {
      try {
        const result = await createCustomerPortal();
        if (result?.data?.url) {
          window.location.href = result.data.url;
        }
      } catch (error) {
        console.error("Failed to create customer portal:", error);
      }
    });
  };

  /**
   * 检查计划是否为当前订阅
   */
  const isCurrentPlan = (plan: (typeof plans)[number]) => {
    if (!currentPriceId) return false;
    return (
      plan.monthlyPriceId === currentPriceId ||
      plan.yearlyPriceId === currentPriceId
    );
  };

  return (
    <section id="pricing" className="container py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Choose the plan that works best for you. All plans include a 14-day
            free trial.
          </p>
        </div>

        {/* Toggle */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <Label
            htmlFor="billing-toggle"
            className={cn(
              "text-sm font-medium",
              !isYearly && "text-foreground",
              isYearly && "text-muted-foreground"
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label
            htmlFor="billing-toggle"
            className={cn(
              "text-sm font-medium",
              isYearly && "text-foreground",
              !isYearly && "text-muted-foreground"
            )}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">
              Save 20%
            </Badge>
          </Label>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = plan.isLifetime
              ? plan.monthlyPrice
              : isYearly
                ? plan.yearlyPrice
                : plan.monthlyPrice;

            const isCurrent = isCurrentPlan(plan);
            const isLoading = loadingPlan === plan.name;

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-xl",
                  plan.highlighted &&
                    "border-violet-500 shadow-lg shadow-violet-500/10",
                  plan.dark && "border-0 bg-foreground text-background",
                  isCurrent && "ring-2 ring-green-500"
                )}
              >
                {plan.highlighted && !isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600">
                    Most Popular
                  </Badge>
                )}
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600">
                    Current Plan
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "text-lg font-semibold",
                      plan.dark && "text-background"
                    )}
                  >
                    {plan.name}
                  </CardTitle>
                  <p
                    className={cn(
                      "text-sm",
                      plan.dark ? "text-background/70" : "text-muted-foreground"
                    )}
                  >
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-6">
                    {price !== null ? (
                      <>
                        <span
                          className={cn(
                            "text-4xl font-bold",
                            plan.dark && "text-background"
                          )}
                        >
                          ${price}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            plan.dark
                              ? "text-background/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {plan.isLifetime
                            ? " one-time"
                            : isYearly
                              ? "/year"
                              : "/month"}
                        </span>
                      </>
                    ) : (
                      <span
                        className={cn(
                          "text-4xl font-bold",
                          plan.dark && "text-background"
                        )}
                      >
                        Custom
                      </span>
                    )}
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0",
                            plan.dark ? "text-background" : "text-violet-600"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm",
                            plan.dark
                              ? "text-background/80"
                              : "text-muted-foreground"
                          )}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full",
                        plan.highlighted && "bg-violet-600 hover:bg-violet-700",
                        plan.dark &&
                          "bg-background text-foreground hover:bg-background/90"
                      )}
                      variant={
                        plan.highlighted || plan.dark ? "default" : "outline"
                      }
                      onClick={() => handleSubscribe(plan)}
                      disabled={isLoading || isPending}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {plan.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
