import { desc, eq } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/db";
import { ticket, user } from "@/db/schema";
import { Link } from "@/i18n/routing";

/**
 * 管理员 - 工单管理列表页面
 *
 * 展示所有用户提交的工单
 */
export default async function AdminTicketsPage() {
  const t = await getTranslations("Admin.tickets");
  const tSupport = await getTranslations("Support");
  const locale = await getLocale();
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
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.open")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.inProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inProgressCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.resolved")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("stats.total")}
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
          <CardTitle>{t("table.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3">{t("table.subject")}</th>
                    <th className="px-4 py-3">{t("table.user")}</th>
                    <th className="px-4 py-3">{t("table.category")}</th>
                    <th className="px-4 py-3">{t("table.priority")}</th>
                    <th className="px-4 py-3">{t("table.status")}</th>
                    <th className="px-4 py-3">{t("table.createdAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tickets/${t.id}`}
                          className="font-medium hover:underline"
                        >
                          {t.subject}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={t.user?.image || undefined}
                              alt={t.user?.name || tSupport("detail.unknownUser")}
                            />
                            <AvatarFallback className="bg-violet-600 text-white text-xs">
                              {t.user?.name
                                ? getInitials(t.user.name)
                                : tSupport("detail.userInitial")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {t.user?.name || tSupport("detail.unknownUser")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {getCategoryLabel(t.category)}
                      </td>
                      <td className="px-4 py-3">{getPriorityBadge(t.priority)}</td>
                      <td className="px-4 py-3">{getStatusBadge(t.status)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString(locale)}
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
