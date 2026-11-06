import "server-only";

import { createElement } from "react";
import { getAllLegalSlugs, getLegalDoc } from "@/lib/source";
import { skinViews } from "@/modules/skin-views";
import type { MarketingHomeViewProps, MarketingLegalViewProps } from "./view";
import { MarketingHeaderControllerView } from "./view";

export function getMarketingHomeViewData(
  locale: string
): MarketingHomeViewProps {
  return { locale };
}

export function getMarketingLegalViewData(
  locale: string,
  slug: string
): MarketingLegalViewProps | null {
  const doc = getLegalDoc(slug, locale);
  if (!doc) return null;

  const formattedDate =
    typeof doc.date === "string"
      ? doc.date
      : doc.date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  return {
    locale,
    slug,
    title: doc.title,
    formattedDate,
    body: createElement(doc.body),
  };
}

export function getMarketingLegalMetadataData(locale: string, slug: string) {
  const doc = getLegalDoc(slug, locale);
  if (!doc) return null;

  return { title: doc.title, description: doc.description };
}

export function getAllMarketingLegalStaticParams() {
  return getAllLegalSlugs();
}

export function MarketingDocsHeader() {
  return createElement(MarketingHeaderControllerView, {
    View: skinViews["marketing.header"],
  });
}
