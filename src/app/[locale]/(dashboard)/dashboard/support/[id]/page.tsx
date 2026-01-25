import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { and, eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/db";
import { ticket, ticketMessage, user } from "@/db/schema";
import { getServerSession } from "@/lib/auth/server";
import {
  ticketCategories,
  ticketPriorities,
  ticketStatuses,
} from "@/features/support/schemas";
import { TicketMessageForm } from "@/features/support/components/ticket-message-form";

interface TicketDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 工单详情页面
 *
 * 展示工单信息和消息历史，允许用户回复
 */
export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id } = await params;

  // 获取当前用户会话
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/sign-in");
  }

  // 获取工单信息
  const ticketResult = await db
    .select()
    .from(ticket)
    .where(and(eq(ticket.id, id), eq(ticket.userId, session.user.id)))
    .limit(1);

  const ticketData = ticketResult[0];
  if (!ticketData) {
    notFound();
  }

  // 获取消息列表
  const messages = await db
    .select({
      id: ticketMessage.id,
      content: ticketMessage.content,
      isAdminResponse: ticketMessage.isAdminResponse,
      createdAt: ticketMessage.createdAt,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
    })
    .from(ticketMessage)
    .leftJoin(user, eq(ticketMessage.userId, user.id))
    .where(eq(ticketMessage.ticketId, id))
    .orderBy(ticketMessage.createdAt);

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

  /**
   * 获取用户名首字母
   */
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isClosed = ticketData.status === "closed";

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {ticketData.subject}
          </h2>
          <p className="text-muted-foreground">
            {getCategoryLabel(ticketData.category)} ·{" "}
            创建于 {new Date(ticketData.createdAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getPriorityBadge(ticketData.priority)}
          {getStatusBadge(ticketData.status)}
        </div>
      </div>

      {/* 消息列表 */}
      <Card>
        <CardHeader>
          <CardTitle>对话记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 p-4 rounded-lg ${
                msg.isAdminResponse
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : "bg-muted/50"
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={msg.user?.image || undefined}
                  alt={msg.user?.name || "用户"}
                />
                <AvatarFallback
                  className={
                    msg.isAdminResponse
                      ? "bg-blue-600 text-white"
                      : "bg-violet-600 text-white"
                  }
                >
                  {msg.user?.name ? getInitials(msg.user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {msg.user?.name || "用户"}
                  </span>
                  {msg.isAdminResponse && (
                    <Badge variant="secondary" className="text-xs">
                      客服
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 回复表单 */}
      {isClosed ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            此工单已关闭，无法添加新消息
          </CardContent>
        </Card>
      ) : (
        <TicketMessageForm ticketId={id} />
      )}
    </div>
  );
}
