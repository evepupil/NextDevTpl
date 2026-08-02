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

import { Loader2, Receipt, RotateCcw, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { findPlanByPriceId } from "@/config/payment";
import {
  PLAN_PRIVILEGES,
  type SubscriptionPlan,
} from "@/config/subscription-plan";
import {
  cancelSubscription,
  getSubscriptionHistory,
  resumeSubscription,
} from "@/features/payment/actions";
import { getMyPlanAction } from "@/features/subscription/actions";
import { PlanBadge, type PlanType } from "@/features/subscription/components";
import { Link } from "@/i18n/routing";

/**
 * 账单设置组件
 */
export function BillingSection() {
  const t = useTranslations("Settings.billing");
  const locale = useLocale();

  // 获取用户订阅计划
  const { execute: fetchPlan, result: planResult } = useAction(getMyPlanAction);
  const { execute: fetchHistory, result: historyResult } = useAction(
    getSubscriptionHistory
  );
  const userPlan = (planResult.data?.plan as PlanType) || "free";
  const planConfig = PLAN_PRIVILEGES[userPlan as SubscriptionPlan];
  const isCancelPending = planResult.data?.cancelAtPeriodEnd ?? false;
  const pendingPlan = planResult.data?.pendingPriceId
    ? findPlanByPriceId(planResult.data.pendingPriceId).plan
    : null;
  const history = historyResult.data?.history ?? [];

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
    ? renewalDate.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const pendingDate = planResult.data?.pendingPriceEffectiveAt
    ? new Date(planResult.data.pendingPriceEffectiveAt)
    : null;
  const formattedPendingDate = pendingDate
    ? pendingDate.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
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
    return price.interval === "yearly"
      ? t("currentPlan.perYear")
      : t("currentPlan.perMonth");
  }, [userPlan, planResult.data?.priceId, t]);

  // 组件挂载时获取计划
  useEffect(() => {
    fetchPlan();
    fetchHistory();
  }, [fetchHistory, fetchPlan]);

  const refreshBilling = () => {
    fetchPlan();
    fetchHistory();
  };

  // 处理取消订阅
  const handleCancelSubscription = () => {
    startCancelTransition(async () => {
      try {
        await cancelSubscription();
        setCancelDialogOpen(false);
        refreshBilling();
        toast.success(t("currentPlan.cancelSuccess"));
      } catch (error) {
        console.error("Failed to cancel subscription:", error);
        toast.error(t("currentPlan.actionFailed"));
      }
    });
  };

  const handleResumeSubscription = () => {
    startCancelTransition(async () => {
      try {
        await resumeSubscription();
        refreshBilling();
        toast.success(t("currentPlan.resumeSuccess"));
      } catch (error) {
        console.error("Failed to resume subscription:", error);
        toast.error(t("currentPlan.actionFailed"));
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
                  <h3 className="text-lg font-semibold">
                    {planConfig.name} Plan
                  </h3>
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
                  <>
                    <Badge variant="secondary" className="text-warning">
                      {t("currentPlan.cancelPending", {
                        date: formattedRenewalDate ?? "",
                      })}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResumeSubscription}
                      disabled={isCancelling}
                    >
                      {isCancelling && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {!isCancelling && <RotateCcw className="mr-2 h-4 w-4" />}
                      {t("currentPlan.resumeSubscription")}
                    </Button>
                  </>
                ) : (
                  <AlertDialog
                    open={cancelDialogOpen}
                    onOpenChange={setCancelDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground"
                      >
                        {t("currentPlan.cancelSubscription")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("currentPlan.cancelDialog.title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <span className="block">
                            {t("currentPlan.cancelDialog.description", {
                              date: formattedRenewalDate ?? "",
                            })}
                          </span>
                          <span className="block font-medium text-foreground">
                            {t("currentPlan.cancelDialog.keepBenefits", {
                              date: formattedRenewalDate ?? "",
                            })}
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("currentPlan.cancelDialog.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancelSubscription}
                          disabled={isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isCancelling && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
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

          {pendingPlan && formattedPendingDate && (
            <p className="mb-4 text-sm text-warning">
              {t("currentPlan.pendingChange", {
                date: formattedPendingDate,
                plan: pendingPlan.name,
              })}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">
                {t("currentPlan.monthlyCredits")}
              </p>
              <p className="font-medium">
                {planConfig.monthlyCredits.toLocaleString()} credits
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {t("currentPlan.renewalDate")}
              </p>
              <p
                className={`font-medium ${isCancelPending ? "text-warning" : ""}`}
              >
                {formattedRenewalDate ?? t("currentPlan.notApplicable")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("currentPlan.price")}</p>
              <p className="font-medium">
                {priceDisplay}
                {priceInterval && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    /{priceInterval}
                  </span>
                )}
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

        <div className="rounded-lg border">
          {history.length > 0 ? (
            <div className="divide-y">
              {history.map((item) => {
                const fromPlan = item.fromPriceId
                  ? findPlanByPriceId(item.fromPriceId).plan?.name
                  : null;
                const toPlan = item.toPriceId
                  ? findPlanByPriceId(item.toPriceId).plan?.name
                  : null;
                const effectiveAt = new Date(item.effectiveAt);
                const createdAt = new Date(item.createdAt);

                return (
                  <div
                    className="grid gap-2 px-4 py-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                    key={item.id}
                  >
                    <time
                      className="text-sm text-muted-foreground"
                      dateTime={createdAt.toISOString()}
                    >
                      {createdAt.toLocaleDateString(
                        locale === "zh" ? "zh-CN" : "en-US",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </time>
                    <div>
                      <p className="font-medium">
                        {t(`history.events.${item.eventType}`)}
                      </p>
                      {(fromPlan || toPlan) && (
                        <p className="text-sm text-muted-foreground">
                          {t("history.planChange", {
                            from: fromPlan ?? t("history.unknownPlan"),
                            to: toPlan ?? t("history.unknownPlan"),
                          })}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground sm:text-right">
                      {t("history.effective", {
                        date: effectiveAt.toLocaleDateString(
                          locale === "zh" ? "zh-CN" : "en-US",
                          { year: "numeric", month: "short", day: "numeric" }
                        ),
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("history.noHistory")}</p>
              <p className="text-sm text-muted-foreground/70">
                {t("history.noHistoryHint")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
