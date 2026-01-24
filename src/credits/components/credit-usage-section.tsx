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
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getMyActiveBatches, getMyCreditsBalance } from "@/credits/actions";

import { TransactionHistory } from "./transaction-history";

/**
 * 格式化日期
 */
function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * 积分使用情况组件
 */
export function CreditUsageSection() {
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
        <h2 className="text-xl font-semibold">Compute Credit Usage</h2>
        <p className="text-sm text-muted-foreground">
          Credits used for AI dialogue, image and etc.
        </p>
      </div>

      {/* 可用积分 */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Coins className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-medium">Available Credits</span>
        </div>

        <div className="text-right">
          {isBalanceLoading ? (
            <div className="animate-pulse">
              <div className="h-10 w-16 bg-muted rounded" />
            </div>
          ) : (
            <>
              <div className="text-4xl font-bold">{balance.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">credits available</div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* 购买更多积分 */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShoppingCart className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-medium">Purchase More Credits</h3>
                <p className="text-sm text-muted-foreground">
                  Get more credits to unlock advanced AI features and capabilities.
                </p>
              </div>

              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/pricing">View Subscription Plans</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/credits/buy">Buy Credit Packages</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 即将过期积分提示 */}
      {expiringBatch && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">
                  Credits Expiring Soon
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {expiringBatch.remaining} credits will expire on{" "}
                  {formatDate(expiringBatch.expiresAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 订阅状态提示 */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-center text-sm text-muted-foreground">
            No active subscription. Purchase a plan to receive monthly credits.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* 交易历史 */}
      <TransactionHistory />
    </div>
  );
}
