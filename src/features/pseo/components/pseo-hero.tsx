import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";

import type { PseoPage } from "../lib/pseo-data";

export function PseoHero({ page }: { page: PseoPage }) {
  const { hero, stats } = page.data;

  return (
    <section className="container relative overflow-hidden py-20 md:py-28">
      <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 left-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Badge
            variant="outline"
            className="mb-6 rounded-full border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            {hero.badge}
          </Badge>

          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {hero.title}{" "}
            <span className="text-primary">{hero.highlight}</span>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            {hero.subtitle}
          </p>

          <div className="mb-10 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={hero.secondaryCta.href}>{hero.secondaryCta.label}</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
          <Card className="relative overflow-hidden border bg-background/80">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {hero.summaryTitle}
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {hero.summaryItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-3 rounded-xl bg-muted/60 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">
                    {page.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Locale</span>
                  <span className="font-medium text-foreground">
                    {page.locale.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="font-medium text-foreground">{page.slug}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
