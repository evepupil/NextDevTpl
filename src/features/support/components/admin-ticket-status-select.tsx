"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateTicketStatusAction } from "@/features/support/actions";
import { ticketStatuses } from "@/features/support/schemas";
import { toast } from "sonner";

interface AdminTicketStatusSelectProps {
  /** 工单 ID */
  ticketId: string;
  /** 当前状态 */
  currentStatus: "open" | "in_progress" | "resolved" | "closed";
}

/**
 * 管理员工单状态选择组件
 *
 * 管理员可以通过此组件修改工单状态
 */
export function AdminTicketStatusSelect({
  ticketId,
  currentStatus,
}: AdminTicketStatusSelectProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  /**
   * 状态颜色映射
   */
  const colorMap: Record<string, string> = {
    open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    in_progress:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    resolved:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };

  /**
   * 获取状态标签
   */
  const getStatusLabel = (s: string) => {
    const statusConfig = ticketStatuses.find((item) => item.value === s);
    return statusConfig?.label || s;
  };

  /**
   * 处理状态变更
   */
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    setIsLoading(true);

    try {
      const result = await updateTicketStatusAction({
        ticketId,
        status: newStatus as "open" | "in_progress" | "resolved" | "closed",
      });

      if (result?.data) {
        toast.success(result.data.message);
        setStatus(newStatus as "open" | "in_progress" | "resolved" | "closed");
        router.refresh();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error("状态更新失败");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">更新中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">选择新状态</p>
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <Badge className={colorMap[status]} variant="secondary">
              {getStatusLabel(status)}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ticketStatuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <Badge className={colorMap[s.value]} variant="secondary">
                {s.label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
