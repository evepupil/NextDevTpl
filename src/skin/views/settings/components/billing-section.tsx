"use client";

import { Loader2, Receipt, RotateCcw, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

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
import { PlanBadge } from "@/components/ui/plan-badge";
import { Separator } from "@/components/ui/separator";
import { useSettingsBillingController } from "@/features/settings/view";
import { Link } from "@/i18n/routing";

function formatDate(date: string, locale: string): string {
  return new Date(date).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

export function BillingSection() {
  const t = useTranslations("Settings.billing");
  const locale = useLocale();
  const { actions, model, state } = useSettingsBillingController();
  const formattedRenewalDate = model.currentPeriodEnd
    ? formatDate(model.currentPeriodEnd, locale)
    : null;
  const formattedPendingDate = model.pendingPriceEffectiveAt
    ? formatDate(model.pendingPriceEffectiveAt, locale)
    : null;

  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{t("currentPlan.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("currentPlan.description")}
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <PlanBadge plan={model.currentPlan} size="lg" showLabel={false} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 break-words text-lg font-semibold">
                    {model.currentPlanName} Plan
                  </h3>
                  <Badge variant="secondary">{t("currentPlan.current")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {model.currentPlan === "free"
                    ? t("currentPlan.basicFeatures")
                    : t("currentPlan.premiumFeatures")}
                </p>
              </div>
            </div>
            {model.currentPlan === "free" && (
              <Button asChild>
                <Link href="/#pricing">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("currentPlan.upgradePlan")}
                </Link>
              </Button>
            )}
            {model.currentPlan !== "free" && (
              <div className="flex max-w-full flex-wrap items-center gap-2">
                {state.isCancelPending ? (
                  <>
                    <Badge variant="secondary" className="text-warning">
                      {t("currentPlan.cancelPending", {
                        date: formattedRenewalDate ?? "",
                      })}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={actions.onResumeSubscription}
                      disabled={state.isCancelling}
                    >
                      {state.isCancelling ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="mr-2 h-4 w-4" />
                      )}
                      {t("currentPlan.resumeSubscription")}
                    </Button>
                  </>
                ) : (
                  <AlertDialog
                    open={state.cancelDialogOpen}
                    onOpenChange={actions.setCancelDialogOpen}
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
                          onClick={(event) => {
                            event.preventDefault();
                            actions.onCancelSubscription();
                          }}
                          disabled={state.isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {state.isCancelling && (
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

          {model.pendingPlan && formattedPendingDate && (
            <p className="mb-4 text-sm text-warning">
              {t("currentPlan.pendingChange", {
                date: formattedPendingDate,
                plan: model.pendingPlan.name,
              })}
            </p>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">
                {t("currentPlan.monthlyCredits")}
              </p>
              <p className="font-medium">
                {model.monthlyCredits.toLocaleString()} credits
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {t("currentPlan.renewalDate")}
              </p>
              <p
                className={`font-medium ${state.isCancelPending ? "text-warning" : ""}`}
              >
                {formattedRenewalDate ?? t("currentPlan.notApplicable")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("currentPlan.price")}</p>
              <p className="font-medium">
                {model.priceDisplay}
                {model.priceInterval && (
                  <span className="text-muted-foreground font-normal">
                    {" "}
                    /{model.priceInterval}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{t("history.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("history.description")}
          </p>
        </div>

        <div className="rounded-lg border">
          {model.history.length > 0 ? (
            <div className="divide-y">
              {model.history.map((item) => {
                const createdAt = new Date(item.createdAt);
                const effectiveAt = formatDate(item.effectiveAt, locale);

                return (
                  <div
                    className="grid gap-2 px-4 py-4 sm:grid-cols-[7rem_1fr_auto] sm:items-center"
                    key={item.id}
                  >
                    <time
                      className="text-sm text-muted-foreground"
                      dateTime={createdAt.toISOString()}
                    >
                      {formatDate(item.createdAt, locale)}
                    </time>
                    <div>
                      <p className="font-medium">
                        {t(`history.events.${item.eventType}`)}
                      </p>
                      {(item.fromPlanName || item.toPlanName) && (
                        <p className="text-sm text-muted-foreground">
                          {t("history.planChange", {
                            from: item.fromPlanName ?? t("history.unknownPlan"),
                            to: item.toPlanName ?? t("history.unknownPlan"),
                          })}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground sm:text-right">
                      {t("history.effective", { date: effectiveAt })}
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
