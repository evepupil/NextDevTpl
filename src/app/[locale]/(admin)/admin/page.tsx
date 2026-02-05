import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import {
  creditsBalance,
  subscription,
  ticket,
  user,
} from "@/db/schema";
import { count, eq, sum, gte } from "drizzle-orm";
import {
  Coins,
  CreditCard,
  MessageSquare,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

/**
 * Admin 控制面板页面
 *
 * 展示关键统计数据:
 * - 用户统计
 * - 工单统计
 * - 积分统计
 * - 订阅统计
 */
export default async function AdminDashboardPage() {
  const t = await getTranslations("Admin.dashboard");
  // 获取今天的开始时间
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 获取本周的开始时间
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // 获取本月的开始时间
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // 并行获取所有统计数据
  const [
    // 用户统计
    totalUsersResult,
    adminUsersResult,
    bannedUsersResult,
    newUsersThisWeekResult,
    // 工单统计
    openTicketsResult,
    inProgressTicketsResult,
    totalTicketsResult,
    newTicketsTodayResult,
    // 积分统计
    totalCreditsResult,
    totalCreditsEarnedResult,
    totalCreditsSpentResult,
    // 订阅统计
    activeSubscriptionsResult,
    totalSubscriptionsResult,
  ] = await Promise.all([
    // 用户统计
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.role, "admin")),
    db.select({ count: count() }).from(user).where(eq(user.banned, true)),
    db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, weekStart)),

    // 工单统计
    db.select({ count: count() }).from(ticket).where(eq(ticket.status, "open")),
    db
      .select({ count: count() })
      .from(ticket)
      .where(eq(ticket.status, "in_progress")),
    db.select({ count: count() }).from(ticket),
    db
      .select({ count: count() })
      .from(ticket)
      .where(gte(ticket.createdAt, todayStart)),

    // 积分统计
    db.select({ total: sum(creditsBalance.balance) }).from(creditsBalance),
    db.select({ total: sum(creditsBalance.totalEarned) }).from(creditsBalance),
    db.select({ total: sum(creditsBalance.totalSpent) }).from(creditsBalance),

    // 订阅统计
    db
      .select({ count: count() })
      .from(subscription)
      .where(eq(subscription.status, "active")),
    db.select({ count: count() }).from(subscription),
  ]);

  // 解析统计结果
  const stats = {
    users: {
      total: totalUsersResult[0]?.count ?? 0,
      admins: adminUsersResult[0]?.count ?? 0,
      banned: bannedUsersResult[0]?.count ?? 0,
      newThisWeek: newUsersThisWeekResult[0]?.count ?? 0,
    },
    tickets: {
      open: openTicketsResult[0]?.count ?? 0,
      inProgress: inProgressTicketsResult[0]?.count ?? 0,
      total: totalTicketsResult[0]?.count ?? 0,
      newToday: newTicketsTodayResult[0]?.count ?? 0,
    },
    credits: {
      totalBalance: Number(totalCreditsResult[0]?.total ?? 0),
      totalEarned: Number(totalCreditsEarnedResult[0]?.total ?? 0),
      totalSpent: Number(totalCreditsSpentResult[0]?.total ?? 0),
    },
    subscriptions: {
      active: activeSubscriptionsResult[0]?.count ?? 0,
      total: totalSubscriptionsResult[0]?.count ?? 0,
    },
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* 主要统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 总用户数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.totalUsers.title")}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              {t("cards.totalUsers.subtext", {
                count: stats.users.newThisWeek,
              })}
            </p>
          </CardContent>
        </Card>

        {/* 待处理工单 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.openTickets.title")}
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.tickets.open + stats.tickets.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cards.openTickets.subtext", {
                count: stats.tickets.newToday,
              })}
            </p>
          </CardContent>
        </Card>

        {/* 活跃订阅 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.activeSubscriptions.title")}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.subscriptions.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cards.activeSubscriptions.subtext", {
                count: stats.subscriptions.total,
              })}
            </p>
          </CardContent>
        </Card>

        {/* 积分流通量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cards.credits.title")}
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.credits.totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cards.credits.subtext")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 用户详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("sections.users.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.users.total")}
              </span>
              <span className="font-medium">{stats.users.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.users.admins")}
              </span>
              <span className="font-medium text-blue-600">
                {stats.users.admins}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.users.regular")}
              </span>
              <span className="font-medium">
                {stats.users.total - stats.users.admins}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.users.banned")}
              </span>
              <span className="font-medium text-red-600">
                {stats.users.banned}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">
                {t("sections.users.newThisWeek")}
              </span>
              <span className="font-medium text-green-600">
                +{stats.users.newThisWeek}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 工单详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t("sections.tickets.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.tickets.open")}
              </span>
              <span className="font-medium text-blue-600">
                {stats.tickets.open}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.tickets.inProgress")}
              </span>
              <span className="font-medium text-yellow-600">
                {stats.tickets.inProgress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.tickets.total")}
              </span>
              <span className="font-medium">{stats.tickets.total}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">
                {t("sections.tickets.newToday")}
              </span>
              <span className="font-medium text-orange-600">
                +{stats.tickets.newToday}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 积分详情 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("sections.credits.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.credits.balance")}
              </span>
              <span className="font-medium text-yellow-600">
                {stats.credits.totalBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.credits.earned")}
              </span>
              <span className="font-medium text-green-600">
                +{stats.credits.totalEarned.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("sections.credits.spent")}
              </span>
              <span className="font-medium text-red-600">
                -{stats.credits.totalSpent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">
                {t("sections.credits.subscribers")}
              </span>
              <span className="font-medium">
                {t("sections.credits.subscribersValue", {
                  count: stats.subscriptions.active,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("quickActions.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/users"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>{t("quickActions.manageUsers")}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {t("quickActions.userCount", { count: stats.users.total })}
              </span>
            </Link>
            <Link
              href="/admin/tickets"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-colors"
            >
              <Ticket className="h-4 w-4" />
              <span>{t("quickActions.handleTickets")}</span>
              {stats.tickets.open > 0 && (
                <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  {t("quickActions.pending", {
                    count: stats.tickets.open,
                  })}
                </span>
              )}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("systemInfo.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("systemInfo.version")}
              </span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("systemInfo.environment")}
              </span>
              <span>{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t("systemInfo.database")}
              </span>
              <span>PostgreSQL</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
