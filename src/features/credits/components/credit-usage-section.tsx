"use client";

/**
 * 积分使用情况组件
 *
 * Settings > Usage Tab 的主要内容
 * 包含:
 * - 可用积分余额
 * - 购买积分入口
 * - 即将过期积分提示
 * - 订阅状态
 * - 交易历史
 */

import { Clock, Coins } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMyActiveBatches, getMyCreditsBalance } from "@/features/credits/actions";

import { TransactionHistory } from "./transaction-history";

/**
 * 格式化日期
 */
function formatDate(date: Date | string | null, locale: string): string {
  if (!date) return "Never";
  const d = new Date(date);
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 积分使用情况组件
 */
export function CreditUsageSection() {
  const t = useTranslations("Settings.usage");
  const locale = useLocale();

  // 获取积分余额
  const {
    execute: fetchBalance,
    result: balanceResult,
    isPending: isBalanceLoading,
  } = useAction(getMyCreditsBalance);

  // 获取活跃批次（用于显示即将过期）
  const {
    execute: fetchBatches,
    result: batchesResult,
  } = useAction(getMyActiveBatches);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchBalance();
    fetchBatches();
  }, [fetchBalance, fetchBatches]);

  const balance = balanceResult.data?.balance ?? 0;
  const batches = batchesResult.data ?? [];

  // 找到最近即将过期的批次
  const expiringBatch = batches
    .filter((b) => b.expiresAt !== null)
    .sort((a, b) => {
      if (!a.expiresAt || !b.expiresAt) return 0;
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    })[0];

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* 可用积分 */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-medium">{t("availableCredits")}</span>
        </div>

        <div className="text-right">
          {isBalanceLoading ? (
            <div className="animate-pulse">
              <div className="h-10 w-16 bg-muted rounded" />
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold">{balance.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">{t("creditsAvailable")}</div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* 购买更多积分 */}
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

      {/* 即将过期积分提示 */}
      {expiringBatch && (
        <>
          <Separator />
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/10">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  {t("expiringSoon.title")}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t("expiringSoon.message", {
                    count: expiringBatch.remaining,
                    date: formatDate(expiringBatch.expiresAt, locale)
                  })}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* 交易历史 */}
      <TransactionHistory />
    </div>
  );
}
