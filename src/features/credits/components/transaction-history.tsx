"use client";

/**
 * 积分交易历史组件
 *
 * 显示用户的积分交易记录表格
 */

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

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
 * 交易类型映射
 */
const TRANSACTION_TYPE_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  registration_bonus: { label: "Registration Bonus", variant: "default" },
  monthly_grant: { label: "Monthly Grant", variant: "default" },
  purchase: { label: "Purchase", variant: "secondary" },
  consumption: { label: "Usage", variant: "destructive" },
  expiration: { label: "Expired", variant: "outline" },
  refund: { label: "Refund", variant: "secondary" },
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
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <p className="text-sm text-muted-foreground">
            View all your credit transactions including grants and consumption
          </p>
        </div>

        {/* 空状态 */}
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
          <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No transactions yet</p>
          <p className="text-sm text-muted-foreground/70">
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
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <p className="text-sm text-muted-foreground">
          View all your credit transactions including grants and consumption
        </p>
      </div>

      {/* 表格 */}
      <div className="rounded-lg border">
        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-3">Date</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-4">Description</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1 text-center">Status</div>
        </div>

        <Separator />

        {/* 加载状态 */}
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          /* 表格内容 */
          <div className="divide-y">
            {transactions.map((tx) => {
              const typeInfo = TRANSACTION_TYPE_MAP[tx.type] ?? {
                label: tx.type,
                variant: "outline" as const,
              };
              const isIncome = isIncomeType(tx.type);

              return (
                <div
                  key={tx.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-muted/30 transition-colors"
                >
                  {/* 日期 */}
                  <div className="col-span-3 text-muted-foreground">
                    {formatDateTime(tx.createdAt)}
                  </div>

                  {/* 类型 */}
                  <div className="col-span-2">
                    <Badge variant={typeInfo.variant} className="text-xs">
                      {typeInfo.label}
                    </Badge>
                  </div>

                  {/* 描述 */}
                  <div className="col-span-4 truncate" title={tx.description ?? ""}>
                    {tx.description ?? "-"}
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

                  {/* 状态 */}
                  <div className="col-span-1 text-center">
                    <Badge
                      variant="outline"
                      className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                    >
                      COMPLETED
                    </Badge>
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
          Showing {Math.min((page - 1) * pageSize + 1, totalCount)} to{" "}
          {Math.min(page * pageSize, totalCount)} of {totalCount} transactions
        </div>

        <div className="flex items-center gap-4">
          {/* 每页数量选择 */}
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
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
            Page {page} of {totalPages}
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
