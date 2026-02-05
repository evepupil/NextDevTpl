import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/db";
import { ticket, ticketMessage, user } from "@/db/schema";
import { AdminTicketReplyForm } from "@/features/support/components/admin-ticket-reply-form";
import { AdminTicketStatusSelect } from "@/features/support/components/admin-ticket-status-select";
import { Link } from "@/i18n/routing";

interface AdminTicketDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 管理员 - 工单详情页面
 *
 * 展示工单信息和消息历史，允许管理员回复和更改状态
 */
export default async function AdminTicketDetailPage({
  params,
}: AdminTicketDetailPageProps) {
  const t = await getTranslations("Admin.tickets");
  const tSupport = await getTranslations("Support");
  const locale = await getLocale();
  const { id } = await params;

  // 获取工单信息（包含用户信息）
  const ticketResult = await db
    .select({
      ticket: ticket,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(ticket)
    .leftJoin(user, eq(ticket.userId, user.id))
    .where(eq(ticket.id, id))
    .limit(1);

  const result = ticketResult[0];
  if (!result) {
    notFound();
  }

  const ticketData = result.ticket;
  const ticketUser = result.user;

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
        {tSupport(`statuses.${status}`)}
      </Badge>
    );
  };

  /**
   * 获取优先级徽章样式
   */
  const getPriorityBadge = (priority: string) => {
    const colorMap: Record<string, string> = {
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    return (
      <Badge className={colorMap[priority] || colorMap.medium} variant="secondary">
        {tSupport(`priorities.${priority}`)}
      </Badge>
    );
  };

  /**
   * 获取类别标签
   */
  const getCategoryLabel = (category: string) => {
    return tSupport(`categories.${category}`);
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

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets">
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
            {tSupport("detail.createdAt", {
              date: new Date(ticketData.createdAt).toLocaleDateString(locale),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getPriorityBadge(ticketData.priority)}
          {getStatusBadge(ticketData.status)}
        </div>
      </div>

      {/* 用户信息和状态管理 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.userInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={ticketUser?.image || undefined}
                  alt={ticketUser?.name || tSupport("detail.unknownUser")}
                />
                <AvatarFallback className="bg-violet-600 text-white">
                  {ticketUser?.name
                    ? getInitials(ticketUser.name)
                    : tSupport("detail.userInitial")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {ticketUser?.name || tSupport("detail.unknownUser")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ticketUser?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminTicketStatusSelect
              ticketId={ticketData.id}
              currentStatus={ticketData.status}
            />
          </CardContent>
        </Card>
      </div>

      {/* 消息列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{tSupport("detail.conversation")}</CardTitle>
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
                  alt={msg.user?.name || tSupport("detail.unknownUser")}
                />
                <AvatarFallback
                  className={
                    msg.isAdminResponse
                      ? "bg-blue-600 text-white"
                      : "bg-violet-600 text-white"
                  }
                >
                  {msg.user?.name
                    ? getInitials(msg.user.name)
                    : tSupport("detail.userInitial")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {msg.user?.name || tSupport("detail.unknownUser")}
                  </span>
                  {msg.isAdminResponse && (
                    <Badge variant="secondary" className="text-xs">
                      {tSupport("detail.supportBadge")}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString(locale)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 管理员回复表单 */}
      <AdminTicketReplyForm
        ticketId={id}
        isClosed={ticketData.status === "closed"}
      />
    </div>
  );
}
