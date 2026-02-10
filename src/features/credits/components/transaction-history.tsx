"use client";

/**
 * 积分交易历史组件
 *
 * 显示用户的积分交易记录表格
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getMyTransactions } from "@/features/credits/actions";
import { cn } from "@/lib/utils";

/**
 * 交易类型键
 */
type TransactionTypeKey = "registration_bonus" | "admin_grant" | "monthly_grant" | "purchase" | "consumption" | "expiration" | "refund";

/**
 * 交易类型变体映射
 */
const TRANSACTION_TYPE_VARIANTS: Record<TransactionTypeKey, "default" | "secondary" | "destructive" | "outline"> = {
  registration_bonus: "default",
  admin_grant: "default",
  monthly_grant: "default",
  purchase: "secondary",
  consumption: "destructive",
  expiration: "outline",
  refund: "secondary",
};

/**
 * 格式化日期时间
 */
function formatDateTime(date: Date | string, locale: string): string {
  const d = new Date(date);
  return d.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 判断是否为收入类型交易
 */
function isIncomeType(type: string): boolean {
  return ["registration_bonus", "admin_grant", "monthly_grant", "purchase", "refund"].includes(type);
}

/**
 * 交易历史组件
 */
export function TransactionHistory() {
  const t = useTranslations("Settings.usage.transactions");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { execute, result, isPending } = useAction(getMyTransactions);

  // 获取交易记录
  useEffect(() => {
    execute({ limit: pageSize, offset: (page - 1) * pageSize });
  }, [execute, page, pageSize]);

  const transactions = result.data ?? [];
  const totalCount = transactions.length; // 简化版，实际应从服务端获取总数
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  /**
   * 获取交易类型标签
   */
  const getTypeLabel = (type: string): string => {
    const typeKey = type as TransactionTypeKey;
    if (typeKey in TRANSACTION_TYPE_VARIANTS) {
      return t(`types.${typeKey}`);
    }
    return type;
  };

  /**
   * 获取本地化的交易描述
   */
  const getLocalizedDescription = (tx: { type: string; description: string | null; metadata?: Record<string, unknown> | null }): string => {
    const meta = tx.metadata;
    switch (tx.type) {
      case "registration_bonus":
        return t("descriptions.registration_bonus");
      case "monthly_grant": {
        const planType = (meta?.planType as string) ?? "";
        const plan = planType.charAt(0).toUpperCase() + planType.slice(1);
        const interval = meta?.interval as string;
        const monthlyCredits = meta?.planType
          ? { starter: "3000", pro: "8000", ultra: "16000" }[planType] ?? ""
          : "";
        if (interval === "year") {
          return t("descriptions.yearly_grant", { plan, monthly: monthlyCredits });
        }
        return t("descriptions.monthly_grant", { plan });
      }
      case "consumption":
        return tx.description ?? t("descriptions.consumption");
      case "expiration":
        return t("descriptions.expiration");
      case "admin_grant":
        return t("descriptions.admin_grant");
      case "refund":
        return t("descriptions.refund");
      default:
        return tx.description ?? "-";
    }
  };

  /**
   * 获取交易类型变体
   */
  const getTypeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    const typeKey = type as TransactionTypeKey;
    return TRANSACTION_TYPE_VARIANTS[typeKey] ?? "outline";
  };

  // 空状态
  if (!isPending && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {/* 标题 */}
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {/* 空状态 */}
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">{t("noTransactions")}</p>
          <p className="text-sm text-muted-foreground/70">
            {t("noTransactionsHint")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border">
        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">{t("date")}</div>
          <div className="col-span-2">{t("type")}</div>
          <div className="col-span-5">{t("transactionDescription")}</div>
          <div className="col-span-2 text-right">{t("transactionAmount")}</div>
        </div>

        <Separator />

        {/* 加载状态 */}
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">{t("loading")}</div>
          </div>
        ) : (
          /* 表格内容 */
          <div className="divide-y">
            {transactions.map((tx) => {
              const isIncome = isIncomeType(tx.type);

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                >
                  {/* 日期 */}
                  <div className="col-span-3 text-muted-foreground">
                    {formatDateTime(tx.createdAt, locale)}
                  </div>

                  {/* 类型 */}
                  <div className="col-span-2">
                    <Badge variant={getTypeVariant(tx.type)} className="text-xs">
                      {getTypeLabel(tx.type)}
                    </Badge>
                  </div>

                  {/* 描述 */}
                  <div className="col-span-5 truncate" title={getLocalizedDescription(tx)}>
                    {getLocalizedDescription(tx)}
                  </div>

                  {/* 金额 */}
                  <div
                    className={cn(
                      "col-span-2 text-right font-medium",
                      isIncome ? "text-emerald-600" : "text-red-500"
                    )}
                  >
                    {isIncome ? "+" : "-"}
                    {tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {t("showing", {
            from: Math.min((page - 1) * pageSize + 1, totalCount),
            to: Math.min(page * pageSize, totalCount),
            total: totalCount
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* 每页数量选择 */}
          <div className="flex items-center gap-2">
            <span>{t("rowsPerPage")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 页码信息 */}
          <span>
            {t("pageOf", { page, total: totalPages })}
          </span>

          {/* 分页按钮 */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
