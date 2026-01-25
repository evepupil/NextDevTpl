import Link from "next/link";
import { Plus, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { ticket } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import {
  ticketCategories,
  ticketPriorities,
  ticketStatuses,
} from "@/features/support/schemas";

/**
 * 用户工单列表页面
 *
 * 展示用户提交的所有支持工单
 */
export default async function SupportPage() {
  // 获取当前用户会话
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  // 获取用户的工单列表
  const tickets = await db
    .select()
    .from(ticket)
    .where(eq(ticket.userId, session.user.id))
    .orderBy(desc(ticket.createdAt));

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    const statusConfig = ticketStatuses.find((s) => s.value === status);
    const colorMap: Record<string, string> = {
      open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      in_progress:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      resolved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    };
    return (
      <Badge className={colorMap[status] || colorMap.closed} variant="secondary">
        {statusConfig?.label || status}
      </Badge>
    );
  };

  /**
   * 获取优先级徽章样式
   */
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = ticketPriorities.find((p) => p.value === priority);
    const colorMap: Record<string, string> = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <Badge className={colorMap[priority] || colorMap.medium} variant="secondary">
        {priorityConfig?.label || priority}
      </Badge>
    );
  };

  /**
   * 获取类别标签
   */
  const getCategoryLabel = (category: string) => {
    const categoryConfig = ticketCategories.find((c) => c.value === category);
    return categoryConfig?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">支持中心</h2>
          <p className="text-muted-foreground">
            查看和管理您的支持工单
          </p>
        </div>
        <Link href="/dashboard/support/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新建工单
          </Button>
        </Link>
      </div>

      {/* 工单列表 */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">暂无工单</h3>
            <p className="text-muted-foreground mb-4">
              您还没有提交过任何支持工单
            </p>
            <Link href="/dashboard/support/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                创建第一个工单
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/support/${t.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{t.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryLabel(t.category)} ·{" "}
                        {new Date(t.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
