import "server-only";

import {
  getAllPseoParams,
  getPseoPage,
  getPseoPages,
  getRelatedPseoPages,
} from "./lib/pseo-data";
import type {
  PseoDetailViewProps,
  PseoListViewProps,
  PseoLocale,
} from "./view";

const overviewCards: Record<PseoLocale, PseoListViewProps["overviewCards"]> = {
  en: [
    {
      title: "JSON-first data",
      description: "Every PSEO page is generated from structured JSON fields.",
      icon: "database",
    },
    {
      title: "Reusable sections",
      description:
        "Hero, features, use cases, FAQ, and CTA reuse the same UI blocks.",
      icon: "layout",
    },
    {
      title: "Locale-aware",
      description:
        "Switch locales to render the matching content automatically.",
      icon: "route",
    },
  ],
  zh: [
    {
      title: "JSON 数据驱动",
      description: "每个 PSEO 页面都来自结构化 JSON 配置。",
      icon: "database",
    },
    {
      title: "复用页面模块",
      description: "Hero、特性、场景、FAQ、CTA 可复用组合。",
      icon: "layout",
    },
    {
      title: "多语言输出",
      description: "自动匹配当前语言版本内容。",
      icon: "route",
    },
  ],
};

export function getPseoListViewData(locale: string): PseoListViewProps {
  const resolvedLocale: PseoLocale = locale === "zh" ? "zh" : "en";
  return {
    locale: resolvedLocale,
    pages: getPseoPages(resolvedLocale),
    overviewCards: overviewCards[resolvedLocale],
  };
}

export function getPseoDetailViewData(
  locale: string,
  slug: string
): PseoDetailViewProps | null {
  const page = getPseoPage(locale, slug);
  if (!page) return null;
  return {
    page,
    relatedPages: getRelatedPseoPages(page.locale, page.slug),
  };
}

export { getAllPseoParams, getPseoPage };
