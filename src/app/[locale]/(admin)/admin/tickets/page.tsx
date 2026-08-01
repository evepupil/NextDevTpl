import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { ticket } from "@/db/schema/support";
import {
  ticketCategories,
  ticketPriorities,
  ticketStatuses,
} from "@/features/support";
import { Link } from "@/i18n/routing";

/**
 * 管理员 - 工单管理列表页面
 *
 * 展示所有用户提交的工单
 */
export default async function AdminTicketsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Support" });

  // 获取所有工单（包含用户信息）
  const tickets = await db
    .select({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(ticket)
    .leftJoin(user, eq(ticket.userId, user.id))
    .orderBy(desc(ticket.createdAt));

  /**
   * 获取状态徽章样式
   */
  const getStatusBadge = (status: string) => {
    const statusConfig = ticketStatuses.find((s) => s.value === status);
    const colorMap: Record<string, string> = {
      open: "bg-primary/15 text-primary",
      in_progress: "bg-warning/15 text-warning",
      resolved: "bg-success/15 text-success",
      closed: "bg-muted text-muted-foreground",
    };
    return (
      <Badge
        className={colorMap[status] || colorMap.closed}
        variant="secondary"
      >
        {statusConfig ? t(statusConfig.label) : status}
      </Badge>
    );
  };

  /**
   * 获取优先级徽章样式
   */
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = ticketPriorities.find((p) => p.value === priority);
    const colorMap: Record<string, string> = {
      low: "bg-success/15 text-success",
      medium: "bg-warning/15 text-warning",
      high: "bg-destructive/15 text-destructive",
    };
    return (
      <Badge
        className={colorMap[priority] || colorMap.medium}
        variant="secondary"
      >
        {priorityConfig ? t(priorityConfig.label) : priority}
      </Badge>
    );
  };

  /**
   * 获取类别标签
   */
  const getCategoryLabel = (category: string) => {
    const categoryConfig = ticketCategories.find((c) => c.value === category);
    return categoryConfig ? t(categoryConfig.label) : category;
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

  // 统计数据
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress"
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("admin.title")}
        </h2>
        <p className="text-muted-foreground">{t("admin.description")}</p>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.stats.open")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.stats.inProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {inProgressCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.stats.resolved")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {resolvedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.stats.total")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* 工单列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("admin.empty")}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3">{t("admin.columns.subject")}</th>
                    <th className="px-4 py-3">{t("admin.columns.user")}</th>
                    <th className="px-4 py-3">{t("admin.columns.category")}</th>
                    <th className="px-4 py-3">{t("admin.columns.priority")}</th>
                    <th className="px-4 py-3">{t("admin.columns.status")}</th>
                    <th className="px-4 py-3">
                      {t("admin.columns.createdAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticketItem) => (
                    <tr
                      key={ticketItem.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tickets/${ticketItem.id}`}
                          className="font-medium hover:underline"
                        >
                          {ticketItem.subject}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={ticketItem.user?.image || undefined}
                              alt={
                                ticketItem.user?.name || t("pages.userFallback")
                              }
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {ticketItem.user?.name
                                ? getInitials(ticketItem.user.name)
                                : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {ticketItem.user?.name || t("admin.unknownUser")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {ticketItem.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getCategoryLabel(ticketItem.category)}
                      </td>
                      <td className="px-4 py-3">
                        {getPriorityBadge(ticketItem.priority)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(ticketItem.status)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(ticketItem.createdAt).toLocaleDateString(
                          locale
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
