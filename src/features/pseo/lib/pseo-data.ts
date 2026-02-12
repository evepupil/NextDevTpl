import pseoPages from "../data/pseo-pages.json";

export interface PseoCtaLink {
  label: string;
  href: string;
}

export interface PseoHeroData {
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  primaryCta: PseoCtaLink;
  secondaryCta: PseoCtaLink;
  summaryTitle: string;
  summaryItems: string[];
}

export interface PseoStat {
  label: string;
  value: string;
  detail: string;
}

export interface PseoSectionCopy {
  title: string;
  subtitle: string;
}

export interface PseoFeature {
  title: string;
  description: string;
  icon: string;
}

export interface PseoUseCase {
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
}

export interface PseoFaqItem {
  question: string;
  answer: string;
}

export interface PseoCta {
  title: string;
  description: string;
  primaryCta: PseoCtaLink;
  secondaryCta: PseoCtaLink;
  note: string;
}

export interface PseoLocaleData {
  seo: {
    title: string;
    description: string;
  };
  hero: PseoHeroData;
  stats: PseoStat[];
  sections: {
    features: PseoSectionCopy;
    useCases: PseoSectionCopy;
    faq: PseoSectionCopy;
    related: PseoSectionCopy;
  };
  features: PseoFeature[];
  useCases: PseoUseCase[];
  faq: PseoFaqItem[];
  cta: PseoCta;
}

export interface PseoPageRecord {
  slug: string;
  category: string;
  locales: Record<string, PseoLocaleData>;
}

export interface PseoPage {
  slug: string;
  category: string;
  locale: string;
  data: PseoLocaleData;
}

const pages = pseoPages as PseoPageRecord[];
const fallbackLocale = "en";

export function getPseoPages(locale: string) {
  return pages
    .map((page) => {
      const data = page.locales[locale] ?? page.locales[fallbackLocale];
      if (!data) {
        return null;
      }
      const resolvedLocale = page.locales[locale] ? locale : fallbackLocale;
      return {
        slug: page.slug,
        category: page.category,
        locale: resolvedLocale,
        data,
      } satisfies PseoPage;
    })
    .filter((page): page is PseoPage => page !== null);
}

export function getPseoPage(locale: string, slug: string) {
  const page = pages.find((entry) => entry.slug === slug);
  if (!page) {
    return null;
  }
  const data = page.locales[locale] ?? page.locales[fallbackLocale];
  if (!data) {
    return null;
  }
  const resolvedLocale = page.locales[locale] ? locale : fallbackLocale;
  return {
    slug: page.slug,
    category: page.category,
    locale: resolvedLocale,
    data,
  } satisfies PseoPage;
}

export function getRelatedPseoPages(
  locale: string,
  slug: string,
  limit = 3,
) {
  return getPseoPages(locale)
    .filter((page) => page.slug !== slug)
    .slice(0, limit);
}

export function getAllPseoParams() {
  return pages.flatMap((page) =>
    Object.keys(page.locales).map((locale) => ({
      locale,
      slug: page.slug,
    })),
  );
}
