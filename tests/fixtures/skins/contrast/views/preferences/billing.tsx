"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsBillingController } from "@/features/settings/view";
import { Link } from "@/i18n/routing";

export function BillingSection() {
  const controller = useSettingsBillingController();
  const format = useFormatter();
  const t = useTranslations("Settings.billing");
  const tSubscription = useTranslations("Subscription.plans");
  const planNames: Record<string, string> = {
    free: tSubscription("free"),
    starter: tSubscription("starter"),
    pro: tSubscription("pro"),
    ultra: tSubscription("ultra"),
  };
  const eventLabel = (eventType: string) => {
    switch (eventType) {
      case "created":
        return t("history.events.created");
      case "upgraded":
        return t("history.events.upgraded");
      case "downgraded":
        return t("history.events.downgraded");
      case "cancellation_requested":
        return t("history.events.cancellation_requested");
      case "cancellation_resumed":
        return t("history.events.cancellation_resumed");
      case "canceled":
        return t("history.events.canceled");
      case "renewed":
        return t("history.events.renewed");
      default:
        return t("history.events.changed");
    }
  };

  return (
    <section className="grid gap-8" data-section="billing">
      <div>
        <h2 className="font-mono text-xl font-semibold">
          {t("currentPlan.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("currentPlan.description")}
        </p>
        <dl className="mt-5 grid max-w-2xl divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-y-0">
          <div className="grid gap-1 py-3 sm:border-r sm:border-border sm:pr-4">
            <dt className="text-xs text-muted-foreground">
              {t("currentPlan.current")}
            </dt>
            <dd className="break-words font-mono text-lg font-semibold">
              {planNames[controller.model.currentPlan] ??
                controller.model.currentPlanName}
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:pl-4">
            <dt className="text-xs text-muted-foreground">
              {t("currentPlan.price")}
            </dt>
            <dd className="font-mono text-lg font-semibold">
              {controller.model.priceDisplay}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {controller.model.priceInterval}
              </span>
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:border-r sm:border-border sm:pr-4">
            <dt className="text-xs text-muted-foreground">
              {t("currentPlan.monthlyCredits")}
            </dt>
            <dd className="font-mono text-sm">
              {format.number(controller.model.monthlyCredits)}
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:pl-4">
            <dt className="text-xs text-muted-foreground">
              {t("currentPlan.renewalDate")}
            </dt>
            <dd className="text-sm">
              {controller.model.currentPeriodEnd
                ? format.dateTime(new Date(controller.model.currentPeriodEnd), {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })
                : t("currentPlan.notApplicable")}
            </dd>
          </div>
        </dl>
        {controller.model.pendingPlan && (
          <p className="mt-3 text-sm text-warning">
            {t("currentPlan.pendingChange", {
              plan: controller.model.pendingPlan.name,
              date: controller.model.pendingPriceEffectiveAt
                ? format.dateTime(
                    new Date(controller.model.pendingPriceEffectiveAt),
                    { dateStyle: "medium", timeZone: "UTC" }
                  )
                : "",
            })}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {controller.state.isCancelPending ? (
            <Button
              disabled={controller.state.isCancelling}
              onClick={controller.actions.onResumeSubscription}
              variant="outline"
            >
              {t("currentPlan.resumeSubscription")}
            </Button>
          ) : controller.model.currentPlan !== "free" ? (
            <Button
              onClick={() => controller.actions.setCancelDialogOpen(true)}
              variant="destructive"
            >
              {t("currentPlan.cancelSubscription")}
            </Button>
          ) : (
            <Button asChild>
              <Link href="/#pricing">{t("currentPlan.upgradePlan")}</Link>
            </Button>
          )}
        </div>
        <Dialog
          onOpenChange={controller.actions.setCancelDialogOpen}
          open={controller.state.cancelDialogOpen}
        >
          <DialogContent>
            <DialogTitle>{t("currentPlan.cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("currentPlan.cancelDialog.description", {
                date: controller.model.currentPeriodEnd
                  ? format.dateTime(
                      new Date(controller.model.currentPeriodEnd),
                      { dateStyle: "medium", timeZone: "UTC" }
                    )
                  : "",
              })}
            </DialogDescription>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                onClick={() => controller.actions.setCancelDialogOpen(false)}
                variant="outline"
              >
                {t("currentPlan.cancelDialog.cancel")}
              </Button>
              <Button
                disabled={controller.state.isCancelling}
                onClick={controller.actions.onCancelSubscription}
                variant="destructive"
              >
                {t("currentPlan.cancelDialog.confirm")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="font-mono text-xl font-semibold">
          {t("history.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("history.description")}
        </p>
        {controller.model.history.length === 0 ? (
          <p className="mt-4 border-y border-border py-4 text-sm text-muted-foreground">
            {t("history.noHistoryHint")}
          </p>
        ) : (
          <div className="mt-4 divide-y divide-border border-y border-border">
            {controller.model.history.map((item) => (
              <div
                className="flex flex-wrap justify-between gap-3 py-3"
                key={item.id}
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">
                    {eventLabel(item.eventType)}
                  </p>
                  {(item.fromPlanName || item.toPlanName) && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      {item.fromPlanName
                        ? (planNames[item.fromPlanName.toLowerCase()] ??
                          item.fromPlanName)
                        : t("history.unknownPlan")}{" "}
                      →{" "}
                      {item.toPlanName
                        ? (planNames[item.toPlanName.toLowerCase()] ??
                          item.toPlanName)
                        : t("history.unknownPlan")}
                    </p>
                  )}
                </div>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={item.createdAt}
                >
                  {format.dateTime(new Date(item.createdAt), {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
