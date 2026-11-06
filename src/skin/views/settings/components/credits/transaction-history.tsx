"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

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
import type { CreditUsageController } from "@/features/credits/view";
import { cn } from "@/lib/utils";

type TransactionTypeKey =
  | "registration_bonus"
  | "admin_grant"
  | "monthly_grant"
  | "purchase"
  | "consumption"
  | "expiration"
  | "refund";

const TRANSACTION_TYPE_VARIANTS: Record<
  TransactionTypeKey,
  "default" | "secondary" | "destructive" | "outline"
> = {
  registration_bonus: "default",
  admin_grant: "default",
  monthly_grant: "default",
  purchase: "secondary",
  consumption: "destructive",
  expiration: "outline",
  refund: "secondary",
};

function formatDateTime(date: Date | string, locale: string): string {
  return new Date(date).toLocaleString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface TransactionHistoryProps {
  controller: CreditUsageController;
}

export function TransactionHistory({ controller }: TransactionHistoryProps) {
  const t = useTranslations("Settings.usage.transactions");
  const locale = useLocale();
  const { actions, model, state } = controller;
  const { page, pageSize } = state;
  const { totalCount, totalPages, transactions } = model;
  const getTypeLabel = (type: string) => {
    const typeKey = type as TransactionTypeKey;
    return typeKey in TRANSACTION_TYPE_VARIANTS ? t(`types.${typeKey}`) : type;
  };

  if (!state.isTransactionsLoading && transactions.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
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
      <div>
        <h3 className="text-lg font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">{t("date")}</div>
          <div className="col-span-2">{t("type")}</div>
          <div className="col-span-5">{t("transactionDescription")}</div>
          <div className="col-span-2 text-right">{t("transactionAmount")}</div>
        </div>

        <Separator />

        {state.isTransactionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              {t("loading")}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((transaction) => {
              const isIncome = transaction.isIncome;
              const typeKey = transaction.type as TransactionTypeKey;
              const typeVariant =
                TRANSACTION_TYPE_VARIANTS[typeKey] ?? "outline";

              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-3 text-muted-foreground">
                    {formatDateTime(transaction.createdAt, locale)}
                  </div>
                  <div className="col-span-2">
                    <Badge variant={typeVariant} className="text-xs">
                      {getTypeLabel(transaction.type)}
                    </Badge>
                  </div>
                  <div
                    className="col-span-5 truncate"
                    title={transaction.displayDescription}
                  >
                    {transaction.displayDescription}
                  </div>
                  <div
                    className={cn(
                      "col-span-2 text-right font-medium",
                      isIncome ? "text-success" : "text-destructive"
                    )}
                  >
                    {isIncome ? "+" : "-"}
                    {transaction.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          {t("showing", {
            from: Math.min((page - 1) * pageSize + 1, totalCount),
            to: Math.min(page * pageSize, totalCount),
            total: totalCount,
          })}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>{t("rowsPerPage")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => actions.setPageSize(Number(value))}
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

          <span>{t("pageOf", { page, total: totalPages })}</span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="First page"
              onClick={() => actions.setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous page"
              onClick={() => actions.setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Next page"
              onClick={() => actions.setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Last page"
              onClick={() => actions.setPage(totalPages)}
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
