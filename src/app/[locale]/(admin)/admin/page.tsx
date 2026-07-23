import { count, eq, gte, sum } from "drizzle-orm";
import {
  Coins,
  CreditCard,
  MessageSquare,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { creditsBalance } from "@/db/schema/credits";
import { subscription } from "@/db/schema/subscription";
import { ticket } from "@/db/schema/support";

/**
 * Admin 控制面板页面
 *
 * 展示关键统计数据（全部真实查询）:
 * - 用户统计 / 工单统计 / 积分统计 / 订阅统计
 */
export default async function AdminDashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  // 并行获取所有统计数据
  const [
    totalUsersResult,
    adminUsersResult,
    bannedUsersResult,
    newUsersThisWeekResult,
    openTicketsResult,
    inProgressTicketsResult,
    totalTicketsResult,
    newTicketsTodayResult,
    totalCreditsResult,
    totalCreditsEarnedResult,
    totalCreditsSpentResult,
    activeSubscriptionsResult,
    totalSubscriptionsResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(user),
    db.select({ count: count() }).from(user).where(eq(user.role, "admin")),
    db.select({ count: count() }).from(user).where(eq(user.banned, true)),
    db
      .select({ count: count() })
      .from(user)
      .where(gte(user.createdAt, weekStart)),

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

    db.select({ total: sum(creditsBalance.balance) }).from(creditsBalance),
    db.select({ total: sum(creditsBalance.totalEarned) }).from(creditsBalance),
    db.select({ total: sum(creditsBalance.totalSpent) }).from(creditsBalance),

    db
      .select({ count: count() })
      .from(subscription)
      .where(eq(subscription.status, "active")),
    db.select({ count: count() }).from(subscription),
  ]);

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
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <span className="eyebrow">控制台</span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">控制面板</h2>
        <p className="text-sm text-muted-foreground">
          欢迎来到管理后台，这里是系统概览。
        </p>
      </div>

      {/* 主要指标卡 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          hint={`本周新增 ${stats.users.newThisWeek} 位`}
          icon={Users}
          label="总用户数"
          value={stats.users.total}
        />
        <StatCard
          accent="warning"
          hint={`今日新增 ${stats.tickets.newToday} 个`}
          icon={Ticket}
          label="待处理工单"
          value={stats.tickets.open + stats.tickets.inProgress}
        />
        <StatCard
          accent="success"
          hint={`总订阅 ${stats.subscriptions.total} 个`}
          icon={CreditCard}
          label="活跃订阅"
          value={stats.subscriptions.active}
        />
        <StatCard
          accent="primary"
          hint="当前用户持有总积分"
          icon={Coins}
          label="积分流通"
          value={stats.credits.totalBalance.toLocaleString()}
        />
      </div>

      {/* 详细统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DetailCard icon={Users} title="用户统计">
          <Row label="总用户" value={stats.users.total} />
          <Row label="管理员" tone="primary" value={stats.users.admins} />
          <Row
            label="普通用户"
            value={stats.users.total - stats.users.admins}
          />
          <Row label="已封禁" tone="destructive" value={stats.users.banned} />
          <Row
            bordered
            label="本周新增"
            tone="success"
            value={`+${stats.users.newThisWeek}`}
          />
        </DetailCard>

        <DetailCard icon={MessageSquare} title="工单统计">
          <Row label="待处理" tone="warning" value={stats.tickets.open} />
          <Row label="处理中" value={stats.tickets.inProgress} />
          <Row label="总工单" value={stats.tickets.total} />
          <Row
            bordered
            label="今日新增"
            tone="warning"
            value={`+${stats.tickets.newToday}`}
          />
        </DetailCard>

        <DetailCard icon={TrendingUp} title="积分流水">
          <Row
            label="当前持有"
            tone="primary"
            value={stats.credits.totalBalance.toLocaleString()}
          />
          <Row
            label="累计发放"
            tone="success"
            value={`+${stats.credits.totalEarned.toLocaleString()}`}
          />
          <Row
            label="累计消费"
            tone="destructive"
            value={`−${stats.credits.totalSpent.toLocaleString()}`}
          />
          <Row
            bordered
            label="订阅用户"
            value={`${stats.subscriptions.active} 活跃`}
          />
        </DetailCard>
      </div>

      {/* 快速操作 + 系统信息 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            <a
              href="/admin/users"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>管理用户</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {stats.users.total} 位
              </span>
            </a>
            <a
              href="/admin/tickets"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <span>处理工单</span>
              {stats.tickets.open > 0 && (
                <span className="ml-auto rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                  {stats.tickets.open} 待处理
                </span>
              )}
            </a>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">系统信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">版本</span>
              <span className="mono-data">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">环境</span>
              <span className="mono-data">{process.env.NODE_ENV}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">数据库</span>
              <span className="mono-data">PostgreSQL</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** 顶部大指标卡 */
function StatCard({
  accent = "default",
  hint,
  icon: Icon,
  label,
  value,
}: {
  accent?: "default" | "primary" | "success" | "warning";
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  const tone =
    accent === "primary"
      ? "text-primary"
      : accent === "success"
        ? "text-success"
        : accent === "warning"
          ? "text-warning"
          : "text-foreground";
  return (
    <Card className="gap-0 py-0 shadow-none">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <div
          className={`mono-data mt-3 text-2xl font-bold tracking-tight ${tone}`}
        >
          {value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </div>
    </Card>
  );
}

/** 详细统计卡（带图标标题 + 多行键值） */
function DetailCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

/** 键值行 */
function Row({
  bordered = false,
  label,
  tone = "default",
  value,
}: {
  bordered?: boolean;
  label: string;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
  value: number | string;
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "success"
        ? "text-success"
        : tone === "warning"
          ? "text-warning"
          : tone === "destructive"
            ? "text-destructive"
            : "text-foreground";
  return (
    <div className={`flex justify-between ${bordered ? "border-t pt-3" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${toneClass}`}>{value}</span>
    </div>
  );
}
