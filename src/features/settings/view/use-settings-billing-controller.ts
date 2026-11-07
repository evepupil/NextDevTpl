"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

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
import {
  resolveSubscriptionActionOutcome,
  type SubscriptionActionResult,
} from "@/features/settings/utils";
import { getMyPlanAction } from "@/features/subscription/actions";

import type { SettingsBillingController } from "./contracts";

export type {
  SettingsBillingActions,
  SettingsBillingController,
  SettingsBillingHistoryItem,
  SettingsBillingModel,
  SettingsBillingState,
} from "./contracts";

const SUBSCRIPTION_PLANS = ["free", "starter", "pro", "ultra"] as const;

function isSubscriptionPlan(value: string): value is SubscriptionPlan {
  return SUBSCRIPTION_PLANS.some((plan) => plan === value);
}

export function useSettingsBillingController(): SettingsBillingController {
  const t = useTranslations("Settings.billing");
  const { execute: fetchPlan, result: planResult } = useAction(getMyPlanAction);
  const { execute: fetchHistory, result: historyResult } = useAction(
    getSubscriptionHistory
  );
  const [isCancelling, startCancelTransition] = useTransition();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const cancelRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetchPlan();
    fetchHistory();
  }, [fetchHistory, fetchPlan]);

  const refreshBilling = () => {
    fetchPlan();
    fetchHistory();
  };

  const onCancelSubscription = () => {
    startCancelTransition(async () => {
      try {
        const requestId = cancelRequestIdRef.current ?? crypto.randomUUID();
        cancelRequestIdRef.current = requestId;
        const result: SubscriptionActionResult = await cancelSubscription({
          requestId,
        });
        const outcome = resolveSubscriptionActionOutcome(result);
        if (!outcome.ok) {
          console.error("Failed to cancel subscription:", outcome.reason);
          toast.error(t("currentPlan.actionFailed"));
          return;
        }

        cancelRequestIdRef.current = null;
        setCancelDialogOpen(false);
        refreshBilling();
        toast.success(t("currentPlan.cancelSuccess"));
      } catch (error) {
        console.error("Failed to cancel subscription:", error);
        toast.error(t("currentPlan.actionFailed"));
      }
    });
  };

  const onResumeSubscription = () => {
    startCancelTransition(async () => {
      try {
        const result: SubscriptionActionResult = await resumeSubscription();
        const outcome = resolveSubscriptionActionOutcome(result);
        if (!outcome.ok) {
          console.error("Failed to resume subscription:", outcome.reason);
          toast.error(t("currentPlan.actionFailed"));
          return;
        }

        refreshBilling();
        toast.success(t("currentPlan.resumeSuccess"));
      } catch (error) {
        console.error("Failed to resume subscription:", error);
        toast.error(t("currentPlan.actionFailed"));
      }
    });
  };

  const planResultData = planResult.data;
  const planId = planResultData?.plan;
  const currentPlan = planId && isSubscriptionPlan(planId) ? planId : "free";
  const planConfig = PLAN_PRIVILEGES[currentPlan];
  const price = planResultData?.priceId
    ? findPlanByPriceId(planResultData.priceId).price
    : null;
  const pendingPlan = planResultData?.pendingPriceId
    ? findPlanByPriceId(planResultData.pendingPriceId).plan
    : null;
  const history = historyResult.data?.history ?? [];

  return {
    actions: {
      onCancelSubscription,
      onResumeSubscription,
      refreshBilling,
      setCancelDialogOpen,
    },
    model: {
      currentPeriodEnd: planResultData?.currentPeriodEnd ?? null,
      currentPlan,
      currentPlanName: planConfig.name,
      history: history.map((item) => ({
        createdAt: item.createdAt,
        effectiveAt: item.effectiveAt,
        eventType: item.eventType,
        fromPlanName: item.fromPriceId
          ? (findPlanByPriceId(item.fromPriceId).plan?.name ?? null)
          : null,
        id: item.id,
        toPlanName: item.toPriceId
          ? (findPlanByPriceId(item.toPriceId).plan?.name ?? null)
          : null,
      })),
      monthlyCredits: planConfig.monthlyCredits,
      pendingPlan: pendingPlan ? { name: pendingPlan.name } : null,
      pendingPriceEffectiveAt: planResultData?.pendingPriceEffectiveAt ?? null,
      priceDisplay:
        currentPlan === "free" ? "$0" : price ? `$${price.amount}` : "-",
      priceInterval:
        currentPlan === "free"
          ? t("currentPlan.perMonth")
          : price?.interval === "yearly"
            ? t("currentPlan.perYear")
            : price
              ? t("currentPlan.perMonth")
              : "",
    },
    state: {
      cancelDialogOpen,
      isCancelling,
      isCancelPending: planResultData?.cancelAtPeriodEnd ?? false,
    },
  };
}
