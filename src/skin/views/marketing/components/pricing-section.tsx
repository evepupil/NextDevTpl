"use client";

import { BookOpen, Check, Coins, Layers, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/components/ui-utils";
import { usePricingController } from "@/features/marketing/view";
import { AnimatedPrice } from "./animated-price";
import { Reveal } from "./reveal";

/**
 * 价格计划组件属性
 */
interface PricingSectionProps {
  /** 用户当前订阅的价格 ID */
  currentPriceId?: string | null;
}

/**
 * 价格计划展示组件
 */
export function PricingSection({ currentPriceId }: PricingSectionProps) {
  const t = useTranslations("Pricing");
  const {
    hasSubscription,
    isPending,
    isYearly,
    onManageSubscription,
    onSubscribe,
    plans,
    setIsYearly,
    yearlyDiscount,
  } = usePricingController(currentPriceId);

  return (
    <section id="pricing" className="border-t py-24">
      <div className="container">
        {/* Header */}
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">{t("label")}</span>
            <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t.rich("subtitle", {
                strong: (chunks) => (
                  <strong className="font-semibold text-primary">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
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
              {t("monthly")}
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
              {t("yearly")}
              <Badge variant="secondary" className="ml-2 text-xs">
                {t("save")} {yearlyDiscount}%
              </Badge>
            </Label>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          {/* Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const planId = plan.id;
              const { isCurrent, isPending: isPlanPending, isLoading } = plan;
              const popular = plan.isPopular;
              const { featureKeys } = plan;

              return (
                <Card
                  key={planId}
                  className={cn(
                    "relative flex flex-col shadow-none transition-all duration-300 hover:shadow-soft",
                    popular && "border-primary shadow-soft",
                    isCurrent && "border-primary ring-1 ring-primary"
                  )}
                >
                  {popular && !isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      {t("mostPopular")}
                    </Badge>
                  )}
                  {isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      {t("currentPlan")}
                    </Badge>
                  )}
                  {isPlanPending && !isCurrent && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      {t("changePending")}
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold tracking-tight">
                      {t(`plans.${planId}.name`)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t(`plans.${planId}.description`)}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-4">
                      <span className="mono-data text-4xl font-bold tracking-tight">
                        $<AnimatedPrice value={plan.price} />
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {plan.priceSuffix}
                      </span>
                    </div>

                    {/* Credits highlight */}
                    <div className="mb-5 rounded-lg border bg-muted/30 px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Coins className="size-4 text-primary" />
                        <span className="text-lg font-bold">
                          {planId === "free" ? (
                            plan.credits.toLocaleString()
                          ) : (
                            <AnimatedPrice
                              value={plan.credits}
                              formatOptions={{
                                useGrouping: true,
                                maximumFractionDigits: 0,
                              }}
                            />
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {planId === "free"
                            ? t(`plans.${planId}.creditsLabel`)
                            : isYearly
                              ? t("creditsPerYear")
                              : t(`plans.${planId}.creditsLabel`)}
                        </span>
                        {planId !== "free" && isYearly && (
                          <Badge
                            variant="secondary"
                            className="ml-1 text-[10px] px-1.5 py-0"
                          >
                            {t("creditsUpfront")}
                          </Badge>
                        )}
                      </div>
                      {t.has(`plans.${planId}.booksCount`) && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="size-3" />
                          <span>
                            {t("booksNote", {
                              count: String(
                                parseInt(t(`plans.${planId}.booksCount`), 10) *
                                  (isYearly ? 12 : 1)
                              ),
                            })}
                          </span>
                        </div>
                      )}
                      {t.has(`plans.${planId}.booksCount`) && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="size-3" />
                          <span>
                            {t("cardsNote", {
                              count: (
                                parseInt(t(`plans.${planId}.booksCount`), 10) *
                                300 *
                                (isYearly ? 12 : 1)
                              ).toLocaleString(),
                            })}
                          </span>
                        </div>
                      )}
                      {t.has(`plans.${planId}.creditsNote`) && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t(`plans.${planId}.creditsNote`)}
                        </div>
                      )}
                    </div>

                    <ul className="mb-6 flex-1 space-y-3">
                      {featureKeys.map((featureKey) => (
                        <li
                          key={featureKey}
                          className="flex items-center gap-2"
                        >
                          <Check className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {t(`plans.${planId}.features.${featureKey}`)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={onManageSubscription}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {t("manageSubscription")}
                      </Button>
                    ) : hasSubscription ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          planId === "free"
                            ? onManageSubscription()
                            : onSubscribe(planId)
                        }
                        disabled={isLoading || isPending}
                      >
                        {isLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {planId === "free"
                          ? t("manageSubscription")
                          : isPlanPending
                            ? t("changePending")
                            : t("changePlan")}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={popular ? "default" : "outline"}
                        onClick={() => onSubscribe(planId)}
                        disabled={isLoading || isPending}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {t(`plans.${planId}.cta`)}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
