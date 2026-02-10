"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

/**
 * Hero Section 组件
 *
 * NextDevTpl 产品主页 Hero 区域
 * - 简洁现代的 Vercel 风格
 * - 信任标识（头像组 + 文案）
 */
export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="container relative overflow-hidden py-20 md:py-28 lg:py-32">
      <div className="mx-auto flex max-w-4xl flex-col items-center">
        {/* Badge */}
        <Badge
          variant="outline"
          className="mb-6 gap-2 rounded-full border-border px-4 py-2 text-sm font-medium"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          {t("badge")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Badge>

        {/* Headline */}
        <h1 className="mb-6 text-center text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          {t("title1")}
          <br />
          <span className="text-primary">{t("titleHighlight")}</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-2xl text-balance text-center text-lg text-muted-foreground">
          {t("subtitle")}
        </p>

        {/* CTAs */}
        <div className="mb-16 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="gap-2 px-8" asChild>
            <Link href="/sign-up">
              {t("getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/#features">{t("seeDemo")}</Link>
          </Button>
        </div>

        {/* Trust line - Avatar group */}
        <div className="mb-16 flex items-center gap-3">
          <div className="flex -space-x-2">
            {[
              "bg-gradient-to-br from-blue-400 to-blue-600",
              "bg-gradient-to-br from-green-400 to-green-600",
              "bg-gradient-to-br from-purple-400 to-purple-600",
              "bg-gradient-to-br from-orange-400 to-orange-600",
              "bg-gradient-to-br from-pink-400 to-pink-600",
            ].map((gradient, i) => (
              <div
                key={i}
                className={`h-8 w-8 rounded-full border-2 border-background ${gradient}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{t("trustLine")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 text-center md:gap-16">
          <div>
            <p className="text-3xl font-bold text-primary">10K+</p>
            <p className="text-sm text-muted-foreground">{t("stats.cards")}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">500+</p>
            <p className="text-sm text-muted-foreground">{t("stats.users")}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">95%</p>
            <p className="text-sm text-muted-foreground">{t("stats.rating")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
