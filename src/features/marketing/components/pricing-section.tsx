"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getPricingPlans, paymentConfig, getPlanPrice } from "@/config/payment";
import { useSession } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { createCheckoutSession, createCustomerPortal } from "@/features/payment/actions";
import { PlanInterval, type Plan } from "@/features/payment/types";

import { AnimatedPrice } from "./animated-price";

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
 * - 从配置读取计划信息
 * - 支持月付/年付切换
 * - 支持订阅和一次性购买
 * - 支持试用期
 * - 集成 Stripe Checkout
 * - 已订阅用户显示管理订阅按钮
 */
export function PricingSection({ currentPriceId }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  // 从配置获取计划列表
  const plans = getPricingPlans();
  const { yearlyDiscount } = paymentConfig;

  /**
   * 获取计划的当前价格信息
   */
  const getCurrentPrice = (plan: Plan) => {
    if (plan.isLifetime) {
      return plan.prices?.[0] ?? null;
    }
    const interval = isYearly ? PlanInterval.YEAR : PlanInterval.MONTH;
    return getPlanPrice(plan, interval);
  };

  /**
   * 获取显示价格
   */
  const getDisplayPrice = (plan: Plan): number | null => {
    if (plan.isFree) return 0;
    if (plan.isEnterprise) return null;

    const price = getCurrentPrice(plan);
    return price?.amount ?? null;
  };

  /**
   * 获取价格后缀文本
   */
  const getPriceSuffix = (plan: Plan): string => {
    if (plan.isLifetime) return " one-time";
    if (plan.isFree) return "/month";
    return isYearly ? "/year" : "/month";
  };

  /**
   * 获取试用期信息
   */
  const getTrialInfo = (plan: Plan): string | null => {
    const price = getCurrentPrice(plan);
    if (price?.trialPeriodDays) {
      return `${price.trialPeriodDays}-day free trial`;
    }
    return null;
  };

  /**
   * 处理订阅按钮点击
   */
  const handleSubscribe = async (plan: Plan) => {
    // 如果是 Enterprise 计划，跳转到联系页面
    if (plan.isEnterprise) {
      router.push("/contact");
      return;
    }

    // 如果是免费计划，跳转到注册页面
    if (plan.isFree) {
      router.push("/sign-up");
      return;
    }

    // 如果用户未登录，跳转到登录页面
    if (!session?.user) {
      router.push("/sign-in?redirect=/#pricing");
      return;
    }

    // 获取当前价格
    const price = getCurrentPrice(plan);
    if (!price?.priceId) return;

    setLoadingPlan(plan.id);

    startTransition(async () => {
      try {
        const result = await createCheckoutSession({
          priceId: price.priceId,
          type: price.type,
          trialPeriodDays: price.trialPeriodDays,
        });
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
        const result = await createCustomerPortal({});
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
  const isCurrentPlan = (plan: Plan) => {
    if (!currentPriceId) return false;
    return plan.prices?.some((p) => p.priceId === currentPriceId) ?? false;
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
              Save {yearlyDiscount}%
            </Badge>
          </Label>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = getDisplayPrice(plan);
            const isCurrent = isCurrentPlan(plan);
            const isLoading = loadingPlan === plan.id;
            const trialInfo = getTrialInfo(plan);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-xl",
                  plan.popular &&
                    "border-violet-500 shadow-lg shadow-violet-500/10",
                  plan.dark && "border-0 bg-foreground text-background",
                  isCurrent && "ring-2 ring-green-500"
                )}
              >
                {plan.popular && !isCurrent && (
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
                          $<AnimatedPrice value={price} />
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            plan.dark
                              ? "text-background/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {getPriceSuffix(plan)}
                        </span>
                        {/* 试用期提示 */}
                        {trialInfo && (
                          <p
                            className={cn(
                              "mt-1 text-xs",
                              plan.dark
                                ? "text-background/60"
                                : "text-muted-foreground"
                            )}
                          >
                            {trialInfo}
                          </p>
                        )}
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
                        plan.popular && "bg-violet-600 hover:bg-violet-700",
                        plan.dark &&
                          "bg-background text-foreground hover:bg-background/90"
                      )}
                      variant={
                        plan.popular || plan.dark ? "default" : "outline"
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
