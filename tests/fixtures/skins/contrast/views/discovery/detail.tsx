import { ArrowUpRight, Check } from "lucide-react";

import type { PseoDetailViewProps } from "@/features/pseo/view";
import { Link } from "@/i18n/routing";

export function PseoDetail({ page, relatedPages }: PseoDetailViewProps) {
  const { data } = page;
  return (
    <main
      className="mx-auto w-full max-w-6xl px-4 py-10"
      data-locale={page.locale}
      data-skin-view="pseo.detail"
    >
      <section className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid content-start gap-5">
          <p className="font-mono text-xs font-semibold uppercase text-primary">
            {data.hero.badge} / {page.category}
          </p>
          <h1 className="max-w-4xl break-words font-mono text-4xl font-semibold">
            {data.hero.title}{" "}
            <span className="text-primary">{data.hero.highlight}</span>
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {data.hero.subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              href={data.hero.primaryCta.href}
            >
              {data.hero.primaryCta.label}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              className="inline-flex min-h-10 items-center border border-border px-4 py-2 text-sm"
              href={data.hero.secondaryCta.href}
            >
              {data.hero.secondaryCta.label}
            </Link>
          </div>
        </div>
        <aside className="border-y border-border py-5">
          <h2 className="font-mono text-sm font-semibold">
            {data.hero.summaryTitle}
          </h2>
          <ul className="mt-3 grid gap-3 text-sm">
            {data.hero.summaryItems.map((item) => (
              <li className="flex min-w-0 gap-2" key={item}>
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-success"
                />
                <span className="break-words">{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
      <section className="grid gap-4 border-b border-border py-8 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat) => (
          <div
            className="grid gap-1 border-l-2 border-primary pl-3"
            key={stat.label}
          >
            <span className="font-mono text-2xl font-semibold">
              {stat.value}
            </span>
            <span className="text-sm">{stat.label}</span>
            <span className="text-xs text-muted-foreground">{stat.detail}</span>
          </div>
        ))}
      </section>
      <section className="grid gap-6 border-b border-border py-8 md:grid-cols-2 lg:grid-cols-3">
        {data.features.map((feature) => (
          <article
            className="grid content-start gap-2 border-t border-border pt-4"
            key={feature.title}
          >
            <p className="font-mono text-xs uppercase text-primary">
              {feature.icon}
            </p>
            <h2 className="break-words font-mono text-lg font-semibold">
              {feature.title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-6 border-b border-border py-8 md:grid-cols-2">
        {data.useCases.map((useCase) => (
          <article className="grid gap-2" key={useCase.title}>
            <h2 className="break-words font-mono text-lg font-semibold">
              {useCase.title}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {useCase.description}
            </p>
            <p className="font-mono text-sm">
              {useCase.metric}{" "}
              <span className="text-muted-foreground">
                {useCase.metricLabel}
              </span>
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-5 border-b border-border py-8">
        <header>
          <h2 className="font-mono text-2xl font-semibold">
            {data.sections.faq.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.sections.faq.subtitle}
          </p>
        </header>
        {data.faq.map((item) => (
          <details className="border-t border-border py-4" key={item.question}>
            <summary className="cursor-pointer font-semibold">
              {item.question}
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {item.answer}
            </p>
          </details>
        ))}
      </section>
      {relatedPages.length > 0 && (
        <section className="grid gap-3 py-8">
          <h2 className="font-mono text-xl font-semibold">
            {data.sections.related.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.sections.related.subtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            {relatedPages.map((related) => (
              <Link
                className="border border-border px-3 py-2 text-sm hover:bg-muted"
                href={"/pseo/" + related.slug}
                key={related.slug}
              >
                {related.data.hero.title}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
