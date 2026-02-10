"use client";

/**
 * 账单设置组件
 *
 * Settings > Billing Tab 的主要内容
 * 包含:
 * - 当前订阅计划
 * - 支付方式
 * - 账单历史
 */

import { Loader2, Receipt, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useAction } from "next-safe-action/hooks";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMyPlanAction } from "@/features/subscription/actions/get-user-plan";
import { cancelSubscription } from "@/features/payment/actions";
import { PlanBadge, type PlanType } from "@/features/subscription/components/plan-badge";
import { PLAN_PRIVILEGES, type SubscriptionPlan } from "@/config/subscription-plan";
import { findPlanByPriceId } from "@/config/payment";

/**
 * 账单设置组件
 */
export function BillingSection() {
  const t = useTranslations("Settings.billing");
  const locale = useLocale();

  // 获取用户订阅计划
  const { execute: fetchPlan, result: planResult } = useAction(getMyPlanAction);
  const userPlan = (planResult.data?.plan as PlanType) || "free";
  const planConfig = PLAN_PRIVILEGES[userPlan as SubscriptionPlan];
  const isCancelPending = planResult.data?.cancelAtPeriodEnd ?? false;

  // 取消订阅
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // 计算续期日期和价格
  const renewalDate = useMemo(() => {
    const iso = planResult.data?.currentPeriodEnd;
    if (!iso) return null;
    return new Date(iso);
  }, [planResult.data?.currentPeriodEnd]);

  const formattedRenewalDate = renewalDate
    ? renewalDate.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" })
    : null;

  const priceDisplay = useMemo(() => {
    if (userPlan === "free") return "$0";
    const priceId = planResult.data?.priceId;
    if (!priceId) return "-";
    const { price } = findPlanByPriceId(priceId);
    if (!price) return "-";
    return `$${price.amount}`;
  }, [userPlan, planResult.data?.priceId]);

  const priceInterval = useMemo(() => {
    if (userPlan === "free") return t("currentPlan.perMonth");
    const priceId = planResult.data?.priceId;
    if (!priceId) return "";
    const { price } = findPlanByPriceId(priceId);
    if (!price) return "";
    return price.interval === "yearly" ? t("currentPlan.perYear") : t("currentPlan.perMonth");
  }, [userPlan, planResult.data?.priceId, t]);

  // 组件挂载时获取计划
  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // 处理取消订阅
  const handleCancelSubscription = () => {
    startCancelTransition(async () => {
      try {
        await cancelSubscription();
        setCancelDialogOpen(false);
        fetchPlan(); // 刷新状态
      } catch (error) {
        console.error("Failed to cancel subscription:", error);
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* 当前计划 */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{t("currentPlan.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("currentPlan.description")}
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <PlanBadge plan={userPlan} size="lg" showLabel={false} />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{planConfig.name} Plan</h3>
                  <Badge variant="secondary">{t("currentPlan.current")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {userPlan === "free"
                    ? t("currentPlan.basicFeatures")
                    : t("currentPlan.premiumFeatures")}
                </p>
              </div>
            </div>
            {userPlan === "free" && (
              <Button asChild>
                <Link href="/#pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("currentPlan.upgradePlan")}
                </Link>
              </Button>
            )}
            {userPlan !== "free" && (
              <div className="flex items-center gap-2">
                {isCancelPending ? (
                  <Badge variant="secondary" className="text-amber-600">
                    {t("currentPlan.cancelPending", { date: formattedRenewalDate ?? "" })}
                  </Badge>
                ) : (
                  <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-muted-foreground">
                        {t("currentPlan.cancelSubscription")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("currentPlan.cancelDialog.title")}</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <span className="block">
                            {t("currentPlan.cancelDialog.description", { date: formattedRenewalDate ?? "" })}
                          </span>
                          <span className="block font-medium text-foreground">
                            {t("currentPlan.cancelDialog.keepBenefits", { date: formattedRenewalDate ?? "" })}
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("currentPlan.cancelDialog.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t("currentPlan.cancelDialog.confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("currentPlan.monthlyCredits")}</p>
              <p className="font-medium">
                {planConfig.monthlyCredits.toLocaleString()} credits
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("currentPlan.renewalDate")}</p>
              <p className={`font-medium ${isCancelPending ? "text-amber-600" : ""}`}>
                {formattedRenewalDate ?? t("currentPlan.notApplicable")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("currentPlan.price")}</p>
              <p className="font-medium">
                {priceDisplay}{priceInterval && <span className="text-muted-foreground font-normal"> /{priceInterval}</span>}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* 账单历史 */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{t("history.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("history.description")}
          </p>
        </div>

        {/* 表格 */}
        <div className="rounded-lg border">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
            <div className="col-span-3">{t("history.date")}</div>
            <div className="col-span-4">{t("history.historyDescription")}</div>
            <div className="col-span-2 text-right">{t("history.amount")}</div>
            <div className="col-span-2 text-center">{t("history.status")}</div>
            <div className="col-span-1 text-center">{t("history.invoice")}</div>
          </div>

          <Separator />

          {/* 空状态 */}
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t("history.noHistory")}</p>
            <p className="text-sm text-muted-foreground/70">
              {t("history.noHistoryHint")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
