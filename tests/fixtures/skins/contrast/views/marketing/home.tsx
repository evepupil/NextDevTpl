"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type {
  MarketingHomeViewProps,
  MarketingPricingPlanModel,
} from "@/features/marketing/view";
import {
  marketingSiteNavigation,
  useMarketingFooterController,
  usePricingController,
} from "@/features/marketing/view";
import { Link } from "@/i18n/routing";

import { PageTitle } from "../shared/fields";

export function MarketingHome({ locale }: MarketingHomeViewProps) {
  const brand = useMarketingFooterController();
  const pricing = usePricingController();
  const format = useFormatter();
  const tPricing = useTranslations("Pricing");
  const tHero = useTranslations("Hero");
  const tFeatures = useTranslations("Features");
  const sampleCopy =
    locale === "zh"
      ? {
          platform: "NextDevTpl / 平台",
          workspace: "示例工作区",
          modules: "模块",
          releases: "版本",
          billingInterval: "计费周期",
          connected: "完整的 SaaS 基础能力，已经全部接通。",
        }
      : {
          platform: "NextDevTpl / Platform",
          workspace: "Starter workspace",
          modules: "MODULES",
          releases: "RELEASES",
          billingInterval: "Billing interval",
          connected: "A complete SaaS foundation, already connected.",
        };
  const featureTitles = [
    tFeatures("items.ai.title"),
    tFeatures("items.multiSource.title"),
    tFeatures("items.outline.title"),
    tFeatures("items.export.title"),
    tFeatures("items.batch.title"),
    tFeatures("items.multilingual.title"),
  ];
  const plans: Record<
    MarketingPricingPlanModel["id"],
    { name: string; description: string; cta: string }
  > = {
    free: {
      name: tPricing("plans.free.name"),
      description: tPricing("plans.free.description"),
      cta: tPricing("plans.free.cta"),
    },
    starter: {
      name: tPricing("plans.starter.name"),
      description: tPricing("plans.starter.description"),
      cta: tPricing("plans.starter.cta"),
    },
    pro: {
      name: tPricing("plans.pro.name"),
      description: tPricing("plans.pro.description"),
      cta: tPricing("plans.pro.cta"),
    },
    ultra: {
      name: tPricing("plans.ultra.name"),
      description: tPricing("plans.ultra.description"),
      cta: tPricing("plans.ultra.cta"),
    },
  };
  const featureLabels: Record<string, string> = {
    creditsNeverExpire: tPricing("plans.free.features.creditsNeverExpire"),
    input: tPricing("plans.free.features.input"),
    characters: tPricing("plans.free.features.characters"),
    fileSize: tPricing("plans.free.features.fileSize"),
    export: tPricing("plans.free.features.export"),
    history: tPricing("plans.free.features.history"),
    support: tPricing("plans.starter.features.support"),
    queue: tPricing("plans.pro.features.queue"),
    customCards: tPricing("plans.pro.features.customCards"),
    aiAssist: tPricing("plans.ultra.features.aiAssist"),
  };

  return (
    <main data-locale={locale} data-skin-view="marketing.home">
      <section className="mx-auto grid min-h-[32rem] max-w-6xl content-center gap-8 px-4 py-12 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <div className="grid content-center gap-5">
          <p className="font-mono text-xs font-semibold uppercase text-primary">
            {sampleCopy.platform}
          </p>
          <h1 className="break-words font-mono text-4xl font-semibold">
            {brand.siteName}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {tHero("subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/sign-up">
                {tHero("getStarted")}
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            {marketingSiteNavigation.docsHref !== null && (
              <Button asChild variant="outline">
                <Link href="/docs">{tHero("seeDemo")}</Link>
              </Button>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>{tFeatures("label")}</span>
            {featureTitles.map((title) => (
              <span key={title}>{title}</span>
            ))}
          </div>
        </div>
        <div className="grid content-center gap-3 border-y border-border py-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="font-mono text-xs uppercase text-muted-foreground">
              {sampleCopy.workspace}
            </span>
            <span className="size-2 bg-success" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border p-4">
              <p className="font-mono text-xs text-muted-foreground">
                {sampleCopy.modules}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold">18</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-mono text-xs text-muted-foreground">
                {sampleCopy.releases}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold">04</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-border p-4">
            <ArrowDown aria-hidden="true" className="size-4 text-success" />
            <p className="text-sm">{sampleCopy.connected}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/40" id="pricing">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <PageTitle
            description={tPricing.rich("subtitle", {
              strong: (chunks) => (
                <strong className="font-semibold text-foreground">
                  {chunks}
                </strong>
              ),
            })}
            eyebrow={tPricing("label")}
            title={tPricing("title")}
          />
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <fieldset
              aria-label={sampleCopy.billingInterval}
              className="inline-flex border border-border p-1"
            >
              <legend className="sr-only">{sampleCopy.billingInterval}</legend>
              <Button
                aria-pressed={!pricing.isYearly}
                onClick={() => pricing.setIsYearly(false)}
                size="sm"
                variant={pricing.isYearly ? "ghost" : "default"}
              >
                {tPricing("monthly")}
              </Button>
              <Button
                aria-pressed={pricing.isYearly}
                onClick={() => pricing.setIsYearly(true)}
                size="sm"
                variant={pricing.isYearly ? "default" : "ghost"}
              >
                {tPricing("yearly")} · {tPricing("save")}{" "}
                {pricing.yearlyDiscount}%
              </Button>
            </fieldset>
            {pricing.hasSubscription && (
              <Button onClick={pricing.onManageSubscription} variant="outline">
                {tPricing("manageSubscription")}
              </Button>
            )}
          </div>
          <div className="grid gap-0 border-y border-border md:grid-cols-2 lg:grid-cols-4">
            {pricing.plans.map((plan) => (
              <article
                className="grid content-start gap-4 border-b border-border p-4 md:border-r lg:border-b-0"
                key={plan.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-mono text-xl font-semibold">
                      {plans[plan.id].name}
                    </h2>
                    <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">
                      {plans[plan.id].description}
                    </p>
                  </div>
                  {plan.isPopular && (
                    <span className="shrink-0 border border-primary px-2 py-1 text-xs text-primary">
                      {tPricing("mostPopular")}
                    </span>
                  )}
                </div>
                <p className="font-mono text-3xl font-semibold">
                  {"$"}
                  {plan.price}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    {plan.priceSuffix}
                  </span>
                </p>
                <p className="border-y border-border py-3 text-sm">
                  <span className="font-mono font-semibold">
                    {format.number(plan.credits)}
                  </span>{" "}
                  {plan.id === "free"
                    ? tPricing("plans.free.creditsLabel")
                    : pricing.isYearly
                      ? tPricing("creditsPerYear")
                      : tPricing("plans.starter.creditsLabel")}
                </p>
                <ul className="grid gap-2 text-xs leading-5 text-muted-foreground">
                  {plan.featureKeys.map((key) => (
                    <li className="flex gap-2" key={key}>
                      <span aria-hidden="true" className="text-success">
                        +
                      </span>
                      <span>{featureLabels[key] ?? key}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  aria-pressed={plan.isCurrent}
                  disabled={plan.isLoading || pricing.isPending}
                  onClick={() =>
                    plan.isCurrent && pricing.hasSubscription
                      ? pricing.onManageSubscription()
                      : pricing.onSubscribe(plan.id)
                  }
                  variant={plan.isCurrent ? "outline" : "default"}
                >
                  {plan.isCurrent
                    ? tPricing("currentPlan")
                    : plan.isPending
                      ? tPricing("changePending")
                      : plan.isLoading
                        ? "Loading..."
                        : plans[plan.id].cta}
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
