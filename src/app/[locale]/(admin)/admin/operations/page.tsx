import { Activity, CreditCard, Ticket, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getOperationsDashboard,
  type MetricState,
} from "@/features/operations";

export default async function OperationsPage() {
  const dashboard = await getOperationsDashboard().catch(() => null);
  if (!dashboard) {
    return (
      <OperationsErrorState message="指标查询失败，请检查数据库连接和所选模块。" />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">运营</span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">运营驾驶舱</h2>
        <p className="text-sm text-muted-foreground">
          数据周期：{dashboard.period.start.slice(0, 10)} 至{" "}
          {dashboard.period.end.slice(0, 10)} · 时区 {dashboard.period.timezone}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="用户总数"
          metric={dashboard.overview.totalUsers}
        />
        <MetricCard
          icon={CreditCard}
          label="活跃订阅"
          metric={dashboard.overview.activeSubscriptions}
        />
        <MetricCard
          icon={Ticket}
          label="周期内工单"
          metric={dashboard.usage.supportTickets}
        />
        <MetricCard
          icon={Activity}
          label="积分消费"
          metric={dashboard.usage.creditConsumption}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricList
          title="经营漏斗"
          items={[
            ["访问", dashboard.funnel.landingVisitors],
            ["注册", dashboard.funnel.registeredUsers],
            ["首次价值", dashboard.funnel.activatedUsers],
            ["付费", dashboard.funnel.paidUsers],
          ]}
        />
        <MetricList
          title="留存"
          items={[
            ["D1", dashboard.retention.d1],
            ["D7", dashboard.retention.d7],
            ["D30", dashboard.retention.d30],
          ]}
        />
        <MetricList
          title="系统健康"
          items={[
            ["API 成功率", dashboard.health.apiSuccessRate],
            ["任务成功率", dashboard.health.jobSuccessRate],
            ["Webhook 成功率", dashboard.health.webhookSuccessRate],
          ]}
        />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">产品使用</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <MetricRow label="周期新增用户" metric={dashboard.usage.newUsers} />
          <MetricRow
            label="当前积分余额"
            metric={dashboard.overview.creditsBalance}
          />
          <MetricRow label="开放工单" metric={dashboard.overview.openTickets} />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  metric,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  metric: MetricState<number>;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <div className="mono-data mt-3 text-2xl font-bold tracking-tight">
          <MetricValue metric={metric} />
        </div>
        <StatusBadge status={metric.status} />
      </div>
    </Card>
  );
}

function MetricList({
  items,
  title,
}: {
  items: ReadonlyArray<readonly [string, MetricState<number>]>;
  title: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map(([label, metric]) => (
          <MetricRow key={label} label={label} metric={metric} />
        ))}
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  metric,
}: {
  label: string;
  metric: MetricState<number>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium">
        <MetricValue metric={metric} />
        <StatusBadge status={metric.status} />
      </span>
    </div>
  );
}

function MetricValue({ metric }: { metric: MetricState<number> }) {
  return metric.value === null ? "--" : metric.value.toLocaleString();
}

function StatusBadge({ status }: { status: MetricState<number>["status"] }) {
  const labels = {
    "not-configured": "未配置",
    partial: "部分数据",
    "query-failed": "查询失败",
    ready: "有效",
    unauthorized: "无权限",
    "zero-data": "暂无数据",
  } as const;
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {labels[status]}
    </span>
  );
}

function OperationsErrorState({ message }: { message: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>运营数据暂不可用</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
