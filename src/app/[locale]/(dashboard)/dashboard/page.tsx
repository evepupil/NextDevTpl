import { eq } from "drizzle-orm";
import {
  ArrowRight,
  Coins,
  Headset,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { creditsBalance } from "@/db/schema";
import { getUserTransactions } from "@/features/credits/query";
import { getUserPlan } from "@/features/subscription/services/user-plan";
import { Link } from "@/i18n/routing";
import { auth } from "@/lib/auth";

/**
 * 积分"进账"类型（用于最近动态里判断 +/- 方向与配色）
 * 其余类型（consumption / expiration）按支出处理
 */
const GAIN_TYPES = new Set([
  "purchase",
  "monthly_grant",
  "registration_bonus",
  "admin_grant",
  "refund",
]);

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "DashboardPages.dashboard",
  });

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // 并行拉真实数据：积分余额 / 订阅计划 / 最近交易
  const [balanceData, userPlan, transactions] = await Promise.all([
    db.query.creditsBalance.findFirst({
      where: eq(creditsBalance.userId, userId),
    }),
    getUserPlan(userId),
    getUserTransactions(userId, { limit: 6 }),
  ]);

  const balance = balanceData?.balance ?? 0;
  const totalEarned = balanceData?.totalEarned ?? 0;
  const totalSpent = balanceData?.totalSpent ?? 0;

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });

  // 计划卡：续期 / 取消 / 免费的副标题
  let planHint = t("planCard.free");
  if (userPlan.hasActiveSubscription && userPlan.currentPeriodEnd) {
    const date = dateFormatter.format(new Date(userPlan.currentPeriodEnd));
    planHint = userPlan.cancelAtPeriodEnd
      ? t("planCard.cancels", { date })
      : t("planCard.renews", { date });
  }

  return (
    <div className="space-y-8">
      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 指标卡 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          accent
          hint={t("stats.credits.description")}
          icon={Coins}
          label={t("stats.credits.title")}
          mono
          value={balance.toLocaleString()}
        />
        <StatCard
          hint={t("stats.plan.description")}
          icon={TrendingUp}
          label={t("stats.plan.title")}
          value={userPlan.planName}
        />
        <StatCard
          hint={t("stats.earned.description")}
          icon={TrendingUp}
          label={t("stats.earned.title")}
          mono
          value={`+${totalEarned.toLocaleString()}`}
        />
        <StatCard
          hint={t("stats.spent.description")}
          icon={TrendingDown}
          label={t("stats.spent.title")}
          mono
          value={`−${totalSpent.toLocaleString()}`}
        />
      </div>

      {/* 主体网格：最近动态（2 列）+ 计划卡 / 快捷操作（1 列） */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 最近动态 */}
        <Card className="gap-0 py-0 shadow-none lg:col-span-2">
          <div className="flex items-center justify-between p-6 pb-4">
            <h3 className="font-semibold tracking-tight">
              {t("transactions.title")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground"
            >
              <Link href="/dashboard/settings">
                {t("transactions.viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <div className="border-t px-6 pb-4">
            {transactions.length === 0 ? (
              <EmptyState text={t("transactions.empty")} />
            ) : (
              <ul className="divide-y divide-border">
                {transactions.map((tx) => {
                  const gain = GAIN_TYPES.has(tx.type);
                  const Icon = gain ? TrendingUp : TrendingDown;
                  return (
                    <li
                      key={tx.id}
                      className="flex items-center gap-3 py-3 first:pt-4 last:pb-1"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          gain
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {tx.description ?? tx.type.replace(/_/g, " ")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(tx.createdAt))}
                        </div>
                      </div>
                      <div
                        className={`mono-data text-sm font-semibold ${
                          gain ? "text-success" : "text-foreground"
                        }`}
                      >
                        {gain ? "+" : "−"}
                        {tx.amount.toLocaleString()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* 侧栏：计划卡 + 快捷操作 */}
        <div className="space-y-6">
          <Card className="gap-0 py-0 shadow-none">
            <div className="p-6">
              <span className="eyebrow">{t("stats.plan.title")}</span>
              <div className="mt-4 text-2xl font-bold tracking-tight">
                {userPlan.planName}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{planHint}</p>
              <Button
                asChild
                size="sm"
                className="mt-5 w-full"
                variant={userPlan.hasActiveSubscription ? "outline" : "default"}
              >
                <Link href="/dashboard/settings">
                  {userPlan.hasActiveSubscription
                    ? t("planCard.manage")
                    : t("planCard.upgrade")}
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="gap-0 p-2 shadow-none">
            <QuickAction href="/dashboard/credits/buy" icon={Coins}>
              {t("actions.credits")}
            </QuickAction>
            <QuickAction href="/dashboard/settings" icon={Settings}>
              {t("actions.settings")}
            </QuickAction>
            <QuickAction href="/dashboard/support" icon={Headset}>
              {t("actions.support")}
            </QuickAction>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** 指标小卡 */
function StatCard({
  accent = false,
  hint,
  icon: Icon,
  label,
  mono = false,
  value,
}: {
  accent?: boolean;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <Icon
            className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground/60"}`}
          />
        </div>
        <div
          className={`mt-3 text-2xl font-bold tracking-tight ${
            mono ? "mono-data" : ""
          } ${accent ? "text-primary" : "text-foreground"}`}
        >
          {value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      </div>
    </Card>
  );
}

/** 空状态 */
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Coins className="h-5 w-5" />
      </span>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

/** 快捷操作行 */
function QuickAction({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{children}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
    </Link>
  );
}
