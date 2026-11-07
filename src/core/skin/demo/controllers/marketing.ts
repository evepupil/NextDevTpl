"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { footerNav, mainNav, productsNav } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { PLAN_CATALOG } from "@/core/plans/catalog.js";
import { PLAN_IDS, type PlanId } from "@/core/plans/contracts.js";
import type {
  MarketingFooterController,
  MarketingHeaderController,
  MarketingPricingController,
} from "@/features/marketing/view";
import {
  filterMarketingNavigation,
  marketingSiteNavigation,
} from "@/features/marketing/view";
import { useRouter } from "@/i18n/routing";

import { resolveDemoAssetUrl } from "../projections.js";
import { useDemoStore } from "../store.js";

export function useMarketingHeaderController(): MarketingHeaderController {
  const { state } = useDemoStore();
  const demoUser = state.data.workspace.user;
  const isSignedIn = state.sessionUserId !== null;

  return {
    isPending: false,
    user: isSignedIn
      ? {
          image: state.avatarPreview ?? resolveDemoAssetUrl(demoUser.image),
          name: demoUser.name,
        }
      : null,
    mainNav: filterMarketingNavigation(mainNav, marketingSiteNavigation),
    productsNav,
  };
}

export function useMarketingFooterController(): MarketingFooterController {
  return {
    siteName: siteConfig.name,
    productLinks: filterMarketingNavigation(
      footerNav.product,
      marketingSiteNavigation
    ),
    legalLinks: filterMarketingNavigation(
      footerNav.legal,
      marketingSiteNavigation
    ),
    socialLinks: {
      github: siteConfig.links.github,
      twitter: siteConfig.links.twitter,
    },
  };
}

export function usePricingController(
  _currentPriceId?: string | null
): MarketingPricingController {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const { state, actions } = useDemoStore();
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const isYearly = state.billingInterval === "year";
  const interval = state.billingInterval;
  const planState = state.data.workspace.plan;
  const hasSubscription =
    state.sessionUserId !== null &&
    planState.id !== "free" &&
    planState.isActive;

  const plans = PLAN_IDS.map((planId) => {
    const plan = PLAN_CATALOG.plans[planId];
    return {
      id: planId,
      price: plan.prices[interval],
      priceSuffix: planId === "free" ? "" : isYearly ? "/year" : "/month",
      credits: plan.monthlyCredits * (planId !== "free" && isYearly ? 12 : 1),
      isCurrent:
        planState.id === planId &&
        (planId === "free"
          ? interval === "month"
          : planState.interval === interval),
      isPending: planState.pendingPlanId === planId,
      isLoading: loadingPlan === planId,
      isPopular: "popular" in plan ? plan.popular : false,
      featureKeys: plan.featureKeys,
    };
  });

  const onSubscribe = (planId: PlanId) => {
    if (!state.sessionUserId) {
      router.push(
        planId === "free" ? "/sign-up" : "/sign-in?redirect=/#pricing"
      );
      return;
    }

    setLoadingPlan(planId);
    startTransition(() => {
      try {
        actions.changePlan(planId, interval);
        const currentIndex = PLAN_IDS.indexOf(planState.id);
        const nextIndex = PLAN_IDS.indexOf(planId);
        toast.success(
          t(
            nextIndex >= currentIndex
              ? "changeSuccess.upgraded"
              : "changeSuccess.downgraded"
          )
        );
      } catch {
        toast.error(t("changeFailed"));
      } finally {
        setLoadingPlan(null);
      }
    });
  };

  return {
    plans,
    isYearly,
    setIsYearly: (value) =>
      actions.setBillingInterval(value ? "year" : "month"),
    yearlyDiscount: PLAN_CATALOG.yearlyDiscount,
    isPending,
    hasSubscription,
    onSubscribe,
    onManageSubscription: () => router.push("/dashboard/settings"),
  };
}
