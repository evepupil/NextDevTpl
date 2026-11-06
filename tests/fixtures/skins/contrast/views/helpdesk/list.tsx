import { ArrowUpRight, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { SupportListViewProps } from "@/features/support/view";
import { Link } from "@/i18n/routing";

function statusLabel(
  status: string,
  t: ReturnType<typeof useTranslations<"Support.statuses">>
) {
  switch (status) {
    case "open":
      return t("open");
    case "in_progress":
      return t("in_progress");
    case "resolved":
      return t("resolved");
    case "closed":
      return t("closed");
    default:
      return status;
  }
}

export function SupportList({ locale, tickets }: SupportListViewProps) {
  const format = useFormatter();
  const t = useTranslations("Support");
  const tDashboard = useTranslations("Dashboard.pages");
  const tStatuses = useTranslations("Support.statuses");
  const categoryLabels: Record<string, string> = {
    billing: t("categories.billing"),
    technical: t("categories.technical"),
    bug: t("categories.bug"),
    feature: t("categories.feature"),
    other: t("categories.other"),
  };
  const priorityLabels: Record<string, string> = {
    low: t("priorities.low"),
    medium: t("priorities.medium"),
    high: t("priorities.high"),
  };
  return (
    <div className="min-w-0" data-locale={locale} data-skin-view="support.list">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs font-semibold uppercase text-primary">
            {locale === "zh" ? "NextDevTpl / 支持" : "NextDevTpl / Support"}
          </p>
          <h1 className="mt-2 break-words font-mono text-3xl font-semibold">
            {t("pages.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("pages.description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/support/new">
            <Plus aria-hidden="true" />
            {tDashboard("newTicket")}
          </Link>
        </Button>
      </header>
      {tickets.length === 0 ? (
        <section className="border-y border-border py-8">
          <h2 className="font-mono text-lg font-semibold">
            {t("pages.emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("pages.emptyDescription")}
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
            href="/dashboard/support/new"
          >
            {t("pages.createFirst")}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {tickets.map((ticket) => (
            <Link
              className="grid min-w-0 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_10rem]"
              href={`/dashboard/support/${ticket.id}`}
              key={ticket.id}
            >
              <span className="min-w-0">
                <span className="block break-words font-semibold">
                  {ticket.subject}
                </span>
                <span className="mt-1 block break-words text-xs text-muted-foreground">
                  {categoryLabels[ticket.category] ?? ticket.category} ·{" "}
                  {priorityLabels[ticket.priority] ?? ticket.priority}
                </span>
              </span>
              <span className="text-sm">
                {statusLabel(ticket.status, tStatuses)}
              </span>
              <time
                className="text-xs text-muted-foreground"
                dateTime={ticket.createdAt}
              >
                {format.dateTime(new Date(ticket.createdAt), {
                  dateStyle: "medium",
                  timeZone: "UTC",
                })}
              </time>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
