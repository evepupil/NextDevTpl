"use client";

import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

import { PLAN_PRIVILEGES } from "@/config/subscription-plan";
import {
  getMyActiveBatches,
  getMyCreditsBalance,
  getMyTransactions,
} from "@/features/credits/actions";

import { isIncomeTransactionType } from "./transaction-direction";

export interface CreditUsageBatch {
  expiresAt: Date | string | null;
  remaining: number;
}

export interface CreditUsageTransaction {
  amount: number;
  createdAt: Date | string;
  displayDescription: string;
  id: string;
  isIncome: boolean;
  type: string;
}

interface TransactionDescriptionData {
  description: string | null;
  metadata: Record<string, unknown> | null;
  type: string;
}

export interface CreditUsageModel {
  balance: number;
  expiringBatch: CreditUsageBatch | undefined;
  totalCount: number;
  totalPages: number;
  transactions: CreditUsageTransaction[];
}

export interface CreditUsageState {
  isBalanceLoading: boolean;
  isTransactionsLoading: boolean;
  page: number;
  pageSize: number;
}

export interface CreditUsageActions {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface CreditUsageController {
  actions: CreditUsageActions;
  model: CreditUsageModel;
  state: CreditUsageState;
}

function getLocalizedDescription(
  transaction: TransactionDescriptionData,
  t: ReturnType<typeof useTranslations<"Settings.usage.transactions">>
): string {
  const metadata = transaction.metadata;

  switch (transaction.type) {
    case "registration_bonus":
      return t("descriptions.registration_bonus");
    case "monthly_grant": {
      const planType = (metadata?.planType as string | undefined) ?? "";
      const plan = planType
        ? planType.charAt(0).toUpperCase() + planType.slice(1)
        : "";
      const interval = metadata?.interval as string | undefined;
      const monthlyCredits =
        planType === "starter" || planType === "pro" || planType === "ultra"
          ? String(PLAN_PRIVILEGES[planType].monthlyCredits)
          : "";

      return interval === "year"
        ? t("descriptions.yearly_grant", {
            plan,
            monthly: monthlyCredits,
          })
        : t("descriptions.monthly_grant", { plan });
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
}

export function useCreditUsageController(): CreditUsageController {
  const t = useTranslations("Settings.usage.transactions");
  const {
    execute: fetchBalance,
    result: balanceResult,
    isPending: isBalanceLoading,
  } = useAction(getMyCreditsBalance);
  const { execute: fetchBatches, result: batchesResult } =
    useAction(getMyActiveBatches);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const {
    execute: fetchTransactions,
    result: transactionsResult,
    isPending: isTransactionsLoading,
  } = useAction(getMyTransactions);

  useEffect(() => {
    fetchBalance();
    fetchBatches();
  }, [fetchBalance, fetchBatches]);

  useEffect(() => {
    fetchTransactions({ limit: pageSize, offset: (page - 1) * pageSize });
  }, [fetchTransactions, page, pageSize]);

  const batches = batchesResult.data ?? [];
  const expiringBatch = batches
    .filter((batch) => batch.expiresAt !== null)
    .sort((left, right) => {
      if (!left.expiresAt || !right.expiresAt) return 0;
      return (
        new Date(left.expiresAt).getTime() - new Date(right.expiresAt).getTime()
      );
    })[0];
  const transactionData = transactionsResult.data;
  const transactions = (transactionData?.transactions ?? []).map((item) => ({
    amount: item.amount,
    createdAt: item.createdAt,
    displayDescription: getLocalizedDescription(item, t),
    id: item.id,
    isIncome: isIncomeTransactionType(item.type),
    type: item.type,
  }));
  const totalCount = transactionData?.totalCount ?? 0;

  return {
    actions: {
      setPage,
      setPageSize: (nextPageSize) => {
        setPageSizeState(nextPageSize);
        setPage(1);
      },
    },
    model: {
      balance: balanceResult.data?.balance ?? 0,
      expiringBatch,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      transactions,
    },
    state: {
      isBalanceLoading,
      isTransactionsLoading,
      page,
      pageSize,
    },
  };
}
