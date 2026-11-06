import {
  ArrowRight,
  Coins,
  Headset,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardOverviewViewProps } from "@/features/dashboard/view";
import { Link } from "@/i18n/routing";

export async function DashboardOverviewView({
  locale,
  data,
}: DashboardOverviewViewProps) {
  const t = await getTranslations({
    locale,
    namespace: "DashboardPages.dashboard",
  });
  const credits = data.credits;
  const plan = data.plan;
  const transactions = credits?.transactions ?? [];
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  });

  let planHint = t("planCard.free");
  if (plan?.hasActiveSubscription && plan.currentPeriodEnd) {
    const date = dateFormatter.format(new Date(plan.currentPeriodEnd));
    planHint = plan.cancelAtPeriodEnd
      ? t("planCard.cancels", { date })
      : t("planCard.renews", { date });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {(credits || plan) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {credits && (
            <StatCard
              accent
              hint={t("stats.credits.description")}
              icon={Coins}
              label={t("stats.credits.title")}
              mono
              value={credits.balance.toLocaleString()}
            />
          )}
          {plan && (
            <StatCard
              hint={t("stats.plan.description")}
              icon={TrendingUp}
              label={t("stats.plan.title")}
              value={plan.planName}
            />
          )}
          {credits && (
            <>
              <StatCard
                hint={t("stats.earned.description")}
                icon={TrendingUp}
                label={t("stats.earned.title")}
                mono
                value={`+${credits.totalEarned.toLocaleString()}`}
              />
              <StatCard
                hint={t("stats.spent.description")}
                icon={TrendingDown}
                label={t("stats.spent.title")}
                mono
                value={`−${credits.totalSpent.toLocaleString()}`}
              />
            </>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {credits && (
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
                  {transactions.map((transaction) => {
                    const gain = transaction.isIncome;
                    const Icon = gain ? TrendingUp : TrendingDown;
                    return (
                      <li
                        key={transaction.id}
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
                            {transaction.description ??
                              transaction.type.replace(/_/g, " ")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dateFormatter.format(
                              new Date(transaction.createdAt)
                            )}
                          </div>
                        </div>
                        <div
                          className={`mono-data text-sm font-semibold ${
                            gain ? "text-success" : "text-foreground"
                          }`}
                        >
                          {gain ? "+" : "−"}
                          {transaction.amount.toLocaleString()}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        )}

        <div className={`space-y-6 ${credits ? "" : "lg:col-span-3"}`}>
          {plan && (
            <Card className="gap-0 py-0 shadow-none">
              <div className="p-6">
                <span className="eyebrow">{t("stats.plan.title")}</span>
                <div className="mt-4 text-2xl font-bold tracking-tight">
                  {plan.planName}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{planHint}</p>
                <Button
                  asChild
                  size="sm"
                  className="mt-5 w-full"
                  variant={plan.hasActiveSubscription ? "outline" : "default"}
                >
                  <Link href="/dashboard/settings">
                    {plan.hasActiveSubscription
                      ? t("planCard.manage")
                      : t("planCard.upgrade")}
                  </Link>
                </Button>
              </div>
            </Card>
          )}

          <Card className="gap-0 p-2 shadow-none">
            {credits && (
              <QuickAction href="/dashboard/credits/buy" icon={Coins}>
                {t("actions.credits")}
              </QuickAction>
            )}
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
