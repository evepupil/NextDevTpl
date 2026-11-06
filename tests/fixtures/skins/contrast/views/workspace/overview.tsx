import { useFormatter, useTranslations } from "next-intl";

import type {
  DashboardOverviewData,
  DashboardOverviewViewProps,
} from "@/features/dashboard/view";

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words font-mono text-lg font-semibold">{value}</dd>
    </div>
  );
}

function OverviewSummary({
  data,
  locale,
}: {
  data: DashboardOverviewData;
  locale: string;
}) {
  const format = useFormatter();
  const tDashboard = useTranslations("DashboardPages.dashboard");
  const tSubscription = useTranslations("Subscription.plans");
  return (
    <>
      <header className="mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs font-semibold uppercase text-primary">
          {locale === "zh" ? "NextDevTpl / 工作区" : "NextDevTpl / Workspace"}
        </p>
        <h1 className="mt-2 break-words font-mono text-3xl font-semibold">
          {tDashboard("title")}
        </h1>
      </header>
      <section className="grid gap-8 border-b border-border pb-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase">
            {tDashboard("stats.credits.title")}
          </h2>
          {data.credits ? (
            <dl>
              <SummaryLine
                label={tDashboard("stats.credits.description")}
                value={format.number(data.credits.balance)}
              />
              <SummaryLine
                label={tDashboard("stats.earned.title")}
                value={format.number(data.credits.totalEarned)}
              />
              <SummaryLine
                label={tDashboard("stats.spent.title")}
                value={format.number(data.credits.totalSpent)}
              />
            </dl>
          ) : (
            <p className="border-y border-border py-4 text-sm text-muted-foreground">
              {locale === "zh"
                ? "当前没有积分摘要。"
                : "No credit summary is available."}
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase">
            {tDashboard("stats.plan.title")}
          </h2>
          {data.plan ? (
            <dl>
              <SummaryLine
                label={tDashboard("stats.plan.title")}
                value={
                  data.plan.planName === "Free"
                    ? tSubscription("free")
                    : data.plan.planName
                }
              />
              {data.plan.currentPeriodEnd && (
                <SummaryLine
                  label={
                    data.plan.cancelAtPeriodEnd
                      ? locale === "zh"
                        ? "到期时间"
                        : "Ends"
                      : locale === "zh"
                        ? "续费时间"
                        : "Renews"
                  }
                  value={format.dateTime(new Date(data.plan.currentPeriodEnd), {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  })}
                />
              )}
            </dl>
          ) : (
            <p className="border-y border-border py-4 text-sm text-muted-foreground">
              {locale === "zh"
                ? "当前没有套餐摘要。"
                : "No subscription summary is available."}
            </p>
          )}
        </div>
      </section>
      {data.credits && (
        <section className="mt-8">
          <h2 className="font-mono text-xl font-semibold">
            {tDashboard("transactions.title")}
          </h2>
          {data.credits.transactions.length === 0 ? (
            <p className="mt-4 border-y border-border py-4 text-sm text-muted-foreground">
              {locale === "zh" ? "暂无近期交易。" : "No recent transactions."}
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border border-y border-border">
              {data.credits.transactions.map((transaction) => (
                <div
                  className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem]"
                  key={transaction.id}
                >
                  <p className="break-words text-sm">
                    {transaction.description ?? transaction.type}
                  </p>
                  <p
                    className={
                      transaction.isIncome
                        ? "font-mono text-sm text-success"
                        : "font-mono text-sm text-destructive"
                    }
                  >
                    {transaction.isIncome ? "+" : "-"}
                    {format.number(transaction.amount)}
                  </p>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={transaction.createdAt}
                  >
                    {format.dateTime(new Date(transaction.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

export function DashboardOverview({
  locale,
  data,
}: DashboardOverviewViewProps) {
  return (
    <div
      className="min-w-0"
      data-locale={locale}
      data-skin-view="dashboard.overview"
    >
      <OverviewSummary data={data} locale={locale} />
    </div>
  );
}
