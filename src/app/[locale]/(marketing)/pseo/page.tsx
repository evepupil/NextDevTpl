import { ArrowUpRight, Database, LayoutTemplate, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getPseoPages } from "@/features/pseo/lib/pseo-data";

export default async function PseoIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const pages = getPseoPages(locale);
  const isZh = locale === "zh";

  const overviewCards = isZh
    ? [
        {
          title: "JSON 数据驱动",
          description: "每个 PSEO 页面都来自结构化 JSON 配置。",
          icon: Database,
        },
        {
          title: "复用页面模块",
          description: "Hero、特性、场景、FAQ、CTA 可复用组合。",
          icon: LayoutTemplate,
        },
        {
          title: "多语言输出",
          description: "自动匹配当前语言版本内容。",
          icon: Route,
        },
      ]
    : [
        {
          title: "JSON-first data",
          description: "Every PSEO page is generated from structured JSON fields.",
          icon: Database,
        },
        {
          title: "Reusable sections",
          description: "Hero, features, use cases, FAQ, and CTA reuse the same UI blocks.",
          icon: LayoutTemplate,
        },
        {
          title: "Locale-aware",
          description: "Switch locales to render the matching content automatically.",
          icon: Route,
        },
      ];

  return (
    <section className="container py-20">
      <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center text-center">
        <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
          PSEO Framework
        </Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          {isZh ? "PSEO 框架演示库" : "Programmatic SEO Demo Library"}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          {isZh
            ? "所有模板均由 JSON 数据驱动，可快速扩展到成百上千个落地页。"
            : "Templates are generated from JSON data and reusable UI blocks. Add entries to scale to thousands of landing pages."}
        </p>
      </div>

      <div className="mx-auto mb-16 grid max-w-5xl gap-6 md:grid-cols-3">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-0 bg-muted/50">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold">{card.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {isZh ? "可用模板" : "Available templates"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isZh
                ? "选择任意模板查看完整的 PSEO 落地页。"
                : "Pick any template to view the full PSEO landing page."}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pages.map((page) => (
            <Card
              key={page.slug}
              className="group rounded-2xl border-0 bg-muted/50 transition-colors hover:bg-muted"
            >
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-center justify-between">
                  <Badge variant="secondary">{page.category}</Badge>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {page.data.hero.title} {page.data.hero.highlight}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {page.data.seo.description}
                </p>
                <div className="mt-auto">
                  <Link
                    href={`/pseo/${page.slug}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {isZh ? "查看模板" : "View template"}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
