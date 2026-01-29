"use client";

/**
 * 积分交易历史组件
 *
 * 显示用户的积分交易记录表格
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyTransactions } from "@/features/credits/actions";
import { cn } from "@/lib/utils";

/**
 * 交易类型映射 - 使用更丰富的颜色
 */
const TRANSACTION_TYPE_MAP: Record<string, { label: string; className: string }> = {
  registration_bonus: {
    label: "Registration Bonus",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  monthly_grant: {
    label: "Monthly Grant",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  purchase: {
    label: "Purchase",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  consumption: {
    label: "Consumption",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  expiration: {
    label: "Expired",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
  refund: {
    label: "Refund",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
};

/**
 * 格式化日期时间
 */
function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
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
  return ["registration_bonus", "monthly_grant", "purchase", "refund"].includes(type);
}

/**
 * 交易历史组件
 */
export function TransactionHistory() {
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

  // 空状态
  if (!isPending && transactions.length === 0) {
    return (
      <div className="space-y-4">
        {/* 标题 */}
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Transaction History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            View all your credit transactions including grants and consumption
          </p>
        </div>

        {/* 空状态 */}
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
          <Inbox className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">No transactions yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Your credit transactions will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Transaction History</h3>
        <p className="text-sm text-muted-foreground mt-1">
          View all your credit transactions including grants and consumption
        </p>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/40 text-sm font-medium text-muted-foreground border-b">
          <div className="col-span-3">Date</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {/* 加载状态 */}
        {isPending ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              <span>Loading...</span>
            </div>
          </div>
        ) : (
          /* 表格内容 */
          <div className="divide-y">
            {transactions.map((tx) => {
              const typeInfo = TRANSACTION_TYPE_MAP[tx.type] ?? {
                label: tx.type,
                className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
              };
              const isIncome = isIncomeType(tx.type);

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3.5 text-sm hover:bg-muted/30 transition-colors items-center"
                >
                  {/* 日期 */}
                  <div className="col-span-3 text-muted-foreground font-mono text-xs">
                    {formatDateTime(tx.createdAt)}
                  </div>

                  {/* 类型 - 使用更精致的标签样式 */}
                  <div className="col-span-2">
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium",
                        typeInfo.className
                      )}
                    >
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* 描述 */}
                  <div className="col-span-4 truncate text-foreground/80" title={tx.description ?? ""}>
                    {tx.description ?? "-"}
                  </div>

                  {/* 金额 */}
                  <div
                    className={cn(
                      "col-span-2 text-right font-semibold tabular-nums",
                      isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-foreground/70"
                    )}
                  >
                    {isIncome ? "+" : ""}
                    {tx.amount}
                  </div>

                  {/* 状态 */}
                  <div className="col-span-1 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      COMPLETED
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <div className="text-xs">
          Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount} transactions
        </div>

        <div className="flex items-center gap-4">
          {/* 每页数量选择 */}
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-16 h-8 text-xs">
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
          <span className="text-xs">
            Page {page} of {totalPages}
          </span>

          {/* 分页按钮 */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
