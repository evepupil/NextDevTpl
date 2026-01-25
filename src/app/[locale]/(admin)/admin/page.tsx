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
        <h2 className="text-2xl font-bold tracking-tight">控制面板</h2>
        <p className="text-muted-foreground">
          欢迎来到管理后台，这里是系统概览。
        </p>
      </div>

      {/* 主要统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 总用户数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">
              本周新增 {stats.users.newThisWeek} 位
            </p>
          </CardContent>
        </Card>

        {/* 待处理工单 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理工单</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.tickets.open + stats.tickets.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">
              今日新增 {stats.tickets.newToday} 个
            </p>
          </CardContent>
        </Card>

        {/* 活跃订阅 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃订阅</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.subscriptions.active}
            </div>
            <p className="text-xs text-muted-foreground">
              总订阅 {stats.subscriptions.total} 个
            </p>
          </CardContent>
        </Card>

        {/* 积分流通量 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">积分流通</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.credits.totalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              当前用户持有总积分
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
              用户统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">总用户</span>
              <span className="font-medium">{stats.users.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">管理员</span>
              <span className="font-medium text-blue-600">
                {stats.users.admins}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">普通用户</span>
              <span className="font-medium">
                {stats.users.total - stats.users.admins}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">已封禁</span>
              <span className="font-medium text-red-600">
                {stats.users.banned}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">本周新增</span>
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
              工单统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">待处理</span>
              <span className="font-medium text-blue-600">
                {stats.tickets.open}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">处理中</span>
              <span className="font-medium text-yellow-600">
                {stats.tickets.inProgress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">总工单</span>
              <span className="font-medium">{stats.tickets.total}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">今日新增</span>
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
              积分流水
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">当前持有</span>
              <span className="font-medium text-yellow-600">
                {stats.credits.totalBalance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">累计发放</span>
              <span className="font-medium text-green-600">
                +{stats.credits.totalEarned.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">累计消费</span>
              <span className="font-medium text-red-600">
                -{stats.credits.totalSpent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">订阅用户</span>
              <span className="font-medium">
                {stats.subscriptions.active} 活跃
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/users"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span>管理用户</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {stats.users.total} 位
              </span>
            </a>
            <a
              href="/admin/tickets"
              className="flex items-center gap-2 rounded-md p-2 hover:bg-muted transition-colors"
            >
              <Ticket className="h-4 w-4" />
              <span>处理工单</span>
              {stats.tickets.open > 0 && (
                <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  {stats.tickets.open} 待处理
                </span>
              )}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">版本</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">环境</span>
              <span>{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">数据库</span>
              <span>PostgreSQL</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
