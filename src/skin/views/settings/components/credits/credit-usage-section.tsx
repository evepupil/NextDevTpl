"use client";

import { Clock, Coins } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCreditUsageController } from "@/features/credits/view";
import { Link } from "@/i18n/routing";

import { TransactionHistory } from "./transaction-history";

function formatDate(date: Date | string | null, locale: string): string {
  if (!date) return "Never";

  return new Date(date).toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-US",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  );
}

export function CreditUsageSection() {
  const t = useTranslations("Settings.usage");
  const locale = useLocale();
  const controller = useCreditUsageController();
  const { expiringBatch } = controller.model;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15">
            <Coins className="h-5 w-5 text-warning" />
          </div>
          <span className="font-medium">{t("availableCredits")}</span>
        </div>

        <div className="text-right">
          {controller.state.isBalanceLoading ? (
            <div className="animate-pulse">
              <div className="h-10 w-16 bg-muted rounded" />
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold">
                {controller.model.balance.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("creditsAvailable")}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t("getMoreCredits.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("getMoreCredits.description")}
          </p>
        </div>

        <div className="flex gap-3">
          <Button asChild>
            <Link href="/#pricing">{t("getMoreCredits.viewPlans")}</Link>
          </Button>
        </div>
      </div>

      {expiringBatch && (
        <>
          <Separator />
          <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning">
                  {t("expiringSoon.title")}
                </p>
                <p className="text-sm text-warning">
                  {t("expiringSoon.message", {
                    count: expiringBatch.remaining,
                    date: formatDate(expiringBatch.expiresAt, locale),
                  })}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      <TransactionHistory controller={controller} />
    </div>
  );
}
