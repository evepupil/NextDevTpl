"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { PLAN_CATALOG } from "@/core/plans/catalog.js";
import type { DemoCreditTransaction } from "@/core/skin/demo/types.js";
import type {
  BalanceBadgeController,
  CreditUsageController,
} from "@/features/credits/view";

import { projectCreditUsage } from "../projections.js";
import { useDemoStore } from "../store.js";

export function useBalanceBadgeController(): BalanceBadgeController {
  const { state } = useDemoStore();
  return { balance: state.data.workspace.credits.balance, isPending: false };
}

export function useCreditUsageController(): CreditUsageController {
  const t = useTranslations("Settings.usage.transactions");
  const { state } = useDemoStore();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);

  const describeTransaction = (transaction: DemoCreditTransaction): string => {
    switch (transaction.type) {
      case "registration_bonus":
        return t("descriptions.registration_bonus");
      case "monthly_grant": {
        const planName = PLAN_CATALOG.plans[transaction.grant.planId].name;
        const monthlyCredits = String(
          PLAN_CATALOG.plans[transaction.grant.planId].monthlyCredits
        );
        return transaction.grant.interval === "year"
          ? t("descriptions.yearly_grant", {
              plan: planName,
              monthly: monthlyCredits,
            })
          : t("descriptions.monthly_grant", { plan: planName });
      }
      case "consumption":
        return transaction.description ?? t("descriptions.consumption");
      case "expiration":
        return t("descriptions.expiration");
      case "admin_grant":
        return t("descriptions.admin_grant");
      case "refund":
        return t("descriptions.refund");
      default:
        return transaction.description ?? "-";
    }
  };

  return {
    actions: {
      setPage: (nextPage) => {
        if (Number.isSafeInteger(nextPage) && nextPage > 0) setPage(nextPage);
      },
      setPageSize: (nextPageSize) => {
        if (!Number.isSafeInteger(nextPageSize) || nextPageSize < 1) return;
        setPageSizeState(nextPageSize);
        setPage(1);
      },
    },
    model: projectCreditUsage(state.data, {
      page,
      pageSize,
      describeTransaction,
    }),
    state: {
      isBalanceLoading: false,
      isTransactionsLoading: false,
      page,
      pageSize,
    },
  };
}
