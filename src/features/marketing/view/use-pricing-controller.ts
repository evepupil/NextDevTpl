"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { getPlanPrice, paymentConfig } from "@/config/payment";
import {
  PLAN_PRIVILEGES,
  type SubscriptionPlan,
} from "@/config/subscription-plan";
import {
  changeSubscriptionPlan,
  createCheckoutSession,
  getUserSubscription,
} from "@/features/payment/actions";
import { PlanInterval } from "@/features/payment/types";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth/client";

import type { MarketingPricingController } from "./contracts";

const planFeatureKeys: Record<SubscriptionPlan, readonly string[]> = {
  free: [
    "creditsNeverExpire",
    "input",
    "characters",
    "fileSize",
    "export",
    "history",
  ],
  starter: [
    "creditsNeverExpire",
    "input",
    "characters",
    "fileSize",
    "export",
    "history",
    "support",
  ],
  pro: [
    "creditsNeverExpire",
    "input",
    "characters",
    "fileSize",
    "queue",
    "export",
    "history",
    "customCards",
    "support",
  ],
  ultra: [
    "creditsNeverExpire",
    "input",
    "characters",
    "fileSize",
    "queue",
    "export",
    "history",
    "customCards",
    "aiAssist",
    "support",
  ],
};

const planIds = Object.keys(PLAN_PRIVILEGES) as SubscriptionPlan[];

export function usePricingController(
  currentPriceId?: string | null
): MarketingPricingController {
  const t = useTranslations("Pricing");
  const [isYearly, setIsYearly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const [activePriceId, setActivePriceId] = useState<string | null>(
    currentPriceId ?? null
  );
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(null);
  const changeRequestRef = useRef<{
    priceId: string;
    requestId: string;
  } | null>(null);

  useEffect(() => {
    if (!session?.user || currentPriceId) return;
    getUserSubscription().then((result) => {
      const userSubscription = result?.data?.subscription;
      setActivePriceId(
        userSubscription?.isActive ? userSubscription.priceId : null
      );
      setPendingPriceId(userSubscription?.pendingPriceId ?? null);
    });
  }, [session?.user, currentPriceId]);

  const hasSubscription = !!activePriceId;

  const getCurrentPrice = (planId: SubscriptionPlan) => {
    const config = paymentConfig.plans[planId];
    if (!config || !("prices" in config) || !config.prices) return null;
    const interval = isYearly ? PlanInterval.YEAR : PlanInterval.MONTH;
    return getPlanPrice(
      { ...config, name: "", description: "", features: [], cta: "" },
      interval
    );
  };

  const handleSubscribe = (planId: SubscriptionPlan) => {
    if (planId === "free") {
      router.push(session?.user ? "/dashboard" : "/sign-up");
      return;
    }

    if (!session?.user) {
      router.push("/sign-in?redirect=/#pricing");
      return;
    }

    const price = getCurrentPrice(planId);
    if (!price?.priceId) return;

    setLoadingPlan(planId);

    startTransition(async () => {
      try {
        if (hasSubscription) {
          const existingRequest = changeRequestRef.current;
          const requestId =
            existingRequest?.priceId === price.priceId
              ? existingRequest.requestId
              : crypto.randomUUID();
          changeRequestRef.current = { priceId: price.priceId, requestId };
          const result = await changeSubscriptionPlan({
            priceId: price.priceId,
            requestId,
          });
          if (!result?.data?.success) {
            toast.error(t("changeFailed"));
            return;
          }

          changeRequestRef.current = null;

          toast.success(
            result.data.direction === "upgrade"
              ? t("changeSuccess.upgraded")
              : t("changeSuccess.downgraded")
          );
          const refreshed = await getUserSubscription();
          const userSubscription = refreshed?.data?.subscription;
          setActivePriceId(
            userSubscription?.isActive ? userSubscription.priceId : null
          );
          setPendingPriceId(userSubscription?.pendingPriceId ?? null);
        } else {
          const result = await createCheckoutSession({
            priceId: price.priceId,
            type: price.type,
          });
          if (result?.data?.url) {
            window.location.href = result.data.url;
          }
        }
      } catch (error) {
        console.error("Failed to create checkout session:", error);
        toast.error(t("changeFailed"));
      } finally {
        setLoadingPlan(null);
      }
    });
  };

  const plans = planIds.map((planId) => {
    const config = paymentConfig.plans[planId];
    const price = getCurrentPrice(planId);
    const isCurrent =
      !!config &&
      "prices" in config &&
      !!activePriceId &&
      !!config.prices?.some((item) => item.priceId === activePriceId);
    const isPending =
      !!config &&
      "prices" in config &&
      !!pendingPriceId &&
      !!config.prices?.some((item) => item.priceId === pendingPriceId);

    return {
      id: planId,
      price: planId === "free" ? 0 : (price?.amount ?? 0),
      priceSuffix: planId === "free" ? "" : isYearly ? "/year" : "/month",
      credits:
        PLAN_PRIVILEGES[planId].monthlyCredits *
        (planId !== "free" && isYearly ? 12 : 1),
      isCurrent,
      isPending,
      isLoading: loadingPlan === planId,
      isPopular: !!config && "popular" in config && !!config.popular,
      featureKeys: planFeatureKeys[planId],
    };
  });

  return {
    plans,
    isYearly,
    setIsYearly,
    yearlyDiscount: paymentConfig.yearlyDiscount,
    isPending,
    hasSubscription,
    onSubscribe: handleSubscribe,
    onManageSubscription: () => router.push("/dashboard/settings"),
  };
}
