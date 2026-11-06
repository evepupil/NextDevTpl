"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { useCreditUsageController } from "@/features/credits/view";
import { Link } from "@/i18n/routing";

import { SelectInput } from "../shared/fields";

export function UsageSection() {
  const usage = useCreditUsageController();
  const format = useFormatter();
  const locale = useLocale();
  const t = useTranslations("Settings.usage");
  const tTransactions = useTranslations("Settings.usage.transactions");
  const pageCopy =
    locale === "zh"
      ? { previous: "上一页", next: "下一页" }
      : { previous: "Previous", next: "Next" };
  const typeLabels: Record<string, string> = {
    registration_bonus: tTransactions("types.registration_bonus"),
    admin_grant: tTransactions("types.admin_grant"),
    monthly_grant: tTransactions("types.monthly_grant"),
    purchase: tTransactions("types.purchase"),
    consumption: tTransactions("types.consumption"),
    expiration: tTransactions("types.expiration"),
    refund: tTransactions("types.refund"),
  };
  const from =
    usage.model.totalCount === 0
      ? 0
      : (usage.state.page - 1) * usage.state.pageSize + 1;
  const to = Math.min(
    usage.state.page * usage.state.pageSize,
    usage.model.totalCount
  );

  return (
    <section className="grid gap-8" data-section="usage">
      <div>
        <h2 className="font-mono text-xl font-semibold">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        <dl className="mt-5 max-w-xl border-y border-border py-4">
          <dt className="text-sm text-muted-foreground">
            {t("availableCredits")}
          </dt>
          <dd className="mt-2 font-mono text-3xl font-semibold">
            {usage.state.isBalanceLoading
              ? "..."
              : format.number(usage.model.balance)}
          </dd>
        </dl>
        {usage.model.expiringBatch && (
          <p className="mt-4 border-l-2 border-warning pl-3 text-sm">
            {t("expiringSoon.message", {
              count: usage.model.expiringBatch.remaining,
              date: format.dateTime(
                new Date(usage.model.expiringBatch.expiresAt ?? ""),
                { dateStyle: "medium", timeZone: "UTC" }
              ),
            })}
          </p>
        )}
        <Button asChild className="mt-4" variant="outline">
          <Link href="/#pricing">{t("getMoreCredits.viewPlans")}</Link>
        </Button>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="font-mono text-xl font-semibold">
          {tTransactions("title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {tTransactions("description")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {tTransactions("showing", {
              from,
              to,
              total: usage.model.totalCount,
            })}
          </p>
          <label
            className="flex items-center gap-2 text-xs"
            htmlFor="usage-rows-per-page"
          >
            {tTransactions("rowsPerPage")}
            <SelectInput
              className="w-auto"
              id="usage-rows-per-page"
              onChange={(event) =>
                usage.actions.setPageSize(Number(event.currentTarget.value))
              }
              value={usage.state.pageSize}
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
            </SelectInput>
          </label>
        </div>
        {usage.state.isTransactionsLoading ? (
          <p
            aria-live="polite"
            className="border-y border-border py-5 text-sm text-muted-foreground"
          >
            {tTransactions("loading")}
          </p>
        ) : usage.model.transactions.length === 0 ? (
          <p className="border-y border-border py-5 text-sm text-muted-foreground">
            {tTransactions("noTransactionsHint")}
          </p>
        ) : (
          <div className="mt-3 divide-y divide-border border-y border-border">
            {usage.model.transactions.map((transaction) => (
              <div
                className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_9rem_8rem]"
                key={transaction.id}
              >
                <div className="min-w-0">
                  <p className="break-words text-sm">
                    {transaction.displayDescription}
                  </p>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={new Date(transaction.createdAt).toISOString()}
                  >
                    {format.dateTime(new Date(transaction.createdAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    })}
                  </time>
                </div>
                <span className="text-xs text-muted-foreground">
                  {typeLabels[transaction.type] ?? transaction.type}
                </span>
                <span
                  className={
                    transaction.isIncome
                      ? "font-mono text-sm text-success"
                      : "font-mono text-sm text-destructive"
                  }
                >
                  {transaction.isIncome ? "+" : "-"}
                  {format.number(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Button
            disabled={usage.state.page <= 1}
            onClick={() => usage.actions.setPage(usage.state.page - 1)}
            variant="outline"
          >
            {pageCopy.previous}
          </Button>
          <p
            aria-live="polite"
            className="font-mono text-xs text-muted-foreground"
          >
            {tTransactions("pageOf", {
              page: usage.state.page,
              total: usage.model.totalPages,
            })}
          </p>
          <Button
            disabled={usage.state.page >= usage.model.totalPages}
            onClick={() => usage.actions.setPage(usage.state.page + 1)}
            variant="outline"
          >
            {pageCopy.next}
          </Button>
        </div>
      </div>
    </section>
  );
}
