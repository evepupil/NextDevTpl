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

import { Clock, Coins, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getMyActiveBatches, getMyCreditsBalance } from "@/features/credits/actions";
import { Link } from "@/i18n/routing";

import { TransactionHistory } from "./transaction-history";

/**
 * 积分使用情况组件
 */
export function CreditUsageSection() {
  const t = useTranslations("Credits");
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

  const formatDate = (date: Date | string | null): string => {
    if (!date) return t("usage.date.never");
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {t("usage.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("usage.subtitle")}
        </p>
      </div>

      {/* 可用积分 - 更精致的设计 */}
      <div className="flex items-center justify-between py-6 px-1">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 shadow-sm">
            <Coins className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-base font-medium text-foreground">
            {t("usage.available")}
          </span>
        </div>

        <div className="text-right">
          {isBalanceLoading ? (
            <div className="animate-pulse">
              <div className="h-12 w-20 bg-muted rounded" />
            </div>
          ) : (
            <>
              <div className="text-5xl font-bold tracking-tight text-foreground">
                {balance.toLocaleString(locale)}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {t("usage.availableSuffix")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 购买更多积分 - 更现代的卡片设计 */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/80">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {t("usage.purchase.title")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("usage.purchase.description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/pricing">{t("usage.purchase.viewPlans")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/credits/buy">
                    {t("usage.purchase.buyPackages")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 即将过期积分提示 - 更简洁的警告样式 */}
      {expiringBatch && (
        <Card className="border-orange-200/60 bg-orange-50/50 dark:border-orange-800/40 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-orange-700 dark:text-orange-300">
                  {t("usage.expiring.title")}
                </span>
                <span className="text-orange-600/80 dark:text-orange-400/80 ml-2 text-sm">
                  {t("usage.expiring.message", {
                    amount: expiringBatch.remaining,
                    date: formatDate(expiringBatch.expiresAt),
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 订阅状态提示 */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="py-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("usage.noSubscription")}
          </p>
        </CardContent>
      </Card>

      <Separator className="my-2" />

      {/* 交易历史 */}
      <TransactionHistory />
    </div>
  );
}
