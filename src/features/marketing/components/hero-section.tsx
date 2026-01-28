"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

/**
 * 头像数据
 */
const avatars = [
  { src: "/avatars/01.png", fallback: "A" },
  { src: "/avatars/02.png", fallback: "B" },
  { src: "/avatars/03.png", fallback: "C" },
  { src: "/avatars/04.png", fallback: "D" },
  { src: "/avatars/05.png", fallback: "E" },
];

/**
 * Hero Section 组件
 *
 * 功能:
 * - 展示产品主要价值主张
 * - 支持国际化翻译
 * - 包含 CTA 按钮和社交证明
 */
export function HeroSection() {
  const t = useTranslations("Hero");

  return (
    <section className="container relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Badge */}
        <Badge
          variant="outline"
          className="mb-6 gap-2 rounded-full px-4 py-2 text-sm font-medium"
        >
          <Sparkles className="h-4 w-4 text-violet-500" />
          {t("badge")}
          <ArrowRight className="h-4 w-4" />
        </Badge>

        {/* Headline */}
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          {t("title1")}{" "}
          <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {t("titleHighlight")}
          </span>{" "}
          {t("title2")}
        </h1>

        {/* Subtext */}
        <p className="mb-8 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
          {t("subtitle")}
        </p>

        {/* CTAs */}
        <div className="mb-12 flex flex-col gap-4 sm:flex-row">
          <Button
            size="lg"
            className="gap-2 bg-violet-600 hover:bg-violet-700"
            asChild
          >
            <Link href="/sign-up">
              {t("getStarted")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">{t("seeDemo")}</Link>
          </Button>
        </div>

        {/* Social Proof */}
        <div className="mb-16 flex flex-col items-center gap-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("socialProof")}
          </p>
          <div className="flex -space-x-3">
            {avatars.map((avatar, i) => (
              <Avatar key={i} className="h-10 w-10 border-2 border-background">
                <AvatarImage src={avatar.src} />
                <AvatarFallback className="bg-violet-100 text-violet-700">
                  {avatar.fallback}
                </AvatarFallback>
              </Avatar>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-violet-600 text-xs font-medium text-white">
              +2k
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative w-full max-w-4xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <div className="h-3 w-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-sm text-muted-foreground">
                dashboard.nextdevtpl.com
              </div>
            </div>
            <div className="aspect-[16/9] bg-gradient-to-br from-muted/50 to-muted p-8">
              <div className="grid h-full grid-cols-3 gap-4">
                <div className="space-y-4">
                  <div className="h-24 rounded-lg bg-background/80 shadow-sm" />
                  <div className="h-24 rounded-lg bg-background/80 shadow-sm" />
                  <div className="h-32 rounded-lg bg-background/80 shadow-sm" />
                </div>
                <div className="space-y-4">
                  <div className="h-48 rounded-lg bg-background/80 shadow-sm" />
                  <div className="h-36 rounded-lg bg-background/80 shadow-sm" />
                </div>
                <div className="space-y-4">
                  <div className="h-20 rounded-lg bg-background/80 shadow-sm" />
                  <div className="h-28 rounded-lg bg-background/80 shadow-sm" />
                  <div className="h-32 rounded-lg bg-background/80 shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
