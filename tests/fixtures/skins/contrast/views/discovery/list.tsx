import { ArrowUpRight, Database, LayoutGrid, Route } from "lucide-react";

import type { PseoListViewProps } from "@/features/pseo/view";
import { Link } from "@/i18n/routing";

const overviewIcons = {
  database: Database,
  layout: LayoutGrid,
  route: Route,
} as const;

export function PseoList({ locale, pages, overviewCards }: PseoListViewProps) {
  return (
    <main
      className="mx-auto w-full max-w-6xl px-4 py-10"
      data-locale={locale}
      data-skin-view="pseo.list"
    >
      <header className="mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs font-semibold uppercase text-primary">
          {locale === "zh" ? "NextDevTpl / 资料库" : "NextDevTpl / Library"}
        </p>
        <h1 className="mt-2 break-words font-mono text-3xl font-semibold">
          PSEO
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {pages[0]?.data.seo.description ??
            (locale === "zh"
              ? "按主题浏览产品能力与集成资料。"
              : "Browse product capabilities and integration guides.")}
        </p>
      </header>
      <div className="mb-8 grid gap-0 border-y border-border sm:grid-cols-3">
        {overviewCards.map((card) => {
          const Icon = overviewIcons[card.icon];
          return (
            <div
              className="flex min-w-0 items-start gap-3 border-b border-border p-4 sm:border-r"
              key={card.title}
            >
              <Icon
                aria-hidden="true"
                className="size-5 shrink-0 text-primary"
              />
              <div className="min-w-0">
                <h2 className="break-words font-mono text-sm font-semibold">
                  {card.title}
                </h2>
                <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="divide-y divide-border border-y border-border">
        {pages.map((page) => (
          <article
            className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_auto]"
            key={page.slug}
          >
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase text-primary">
                {page.category}
              </p>
              <h2 className="mt-1 break-words font-mono text-xl font-semibold">
                {page.data.hero.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {page.data.hero.subtitle}
              </p>
            </div>
            <Link
              className="inline-flex min-h-9 items-center gap-2 self-end text-sm text-primary underline-offset-4 hover:underline"
              href={"/pseo/" + page.slug}
            >
              {page.data.hero.primaryCta.label}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
