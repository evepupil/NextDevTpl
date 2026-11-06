import pseoPages from "../data/pseo-pages.json";
import type { PseoLocale, PseoPage, PseoPageRecord } from "../view/contracts";

export type {
  PseoCtaData,
  PseoCtaLink,
  PseoFaqItem,
  PseoFeature,
  PseoHeroData,
  PseoLocale,
  PseoLocaleData,
  PseoPage,
  PseoPageRecord,
  PseoSectionCopy,
  PseoStat,
  PseoUseCase,
} from "../view/contracts";

const pages = pseoPages as PseoPageRecord[];
const fallbackLocale: PseoLocale = "en";

function resolveLocale(locale: string): PseoLocale {
  return locale === "zh" ? "zh" : "en";
}

export function getPseoPages(locale: string) {
  const requestedLocale = resolveLocale(locale);
  return pages
    .map((page) => {
      const data =
        page.locales[requestedLocale] ?? page.locales[fallbackLocale];
      if (!data) {
        return null;
      }
      const resolvedLocale = page.locales[requestedLocale]
        ? requestedLocale
        : fallbackLocale;
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
  const requestedLocale = resolveLocale(locale);
  const page = pages.find((entry) => entry.slug === slug);
  if (!page) {
    return null;
  }
  const data = page.locales[requestedLocale] ?? page.locales[fallbackLocale];
  if (!data) {
    return null;
  }
  const resolvedLocale = page.locales[requestedLocale]
    ? requestedLocale
    : fallbackLocale;
  return {
    slug: page.slug,
    category: page.category,
    locale: resolvedLocale,
    data,
  } satisfies PseoPage;
}

export function getRelatedPseoPages(locale: string, slug: string, limit = 3) {
  return getPseoPages(locale)
    .filter((page) => page.slug !== slug)
    .slice(0, limit);
}

export function getAllPseoParams() {
  return pages.flatMap((page) =>
    (Object.keys(page.locales) as PseoLocale[]).map((locale) => ({
      locale,
      slug: page.slug,
    }))
  );
}
