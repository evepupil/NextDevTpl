export type PseoLocale = "en" | "zh";

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

export interface PseoCtaData {
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
  cta: PseoCtaData;
}

export interface PseoPageRecord {
  slug: string;
  category: string;
  locales: Partial<Record<PseoLocale, PseoLocaleData>>;
}

export interface PseoPage {
  slug: string;
  category: string;
  locale: PseoLocale;
  data: PseoLocaleData;
}

export interface PseoOverviewCard {
  title: string;
  description: string;
  icon: "database" | "layout" | "route";
}

export interface PseoListViewProps {
  locale: PseoLocale;
  pages: readonly PseoPage[];
  overviewCards: readonly PseoOverviewCard[];
}

export interface PseoDetailViewProps {
  page: PseoPage;
  relatedPages: readonly PseoPage[];
}

export interface ViewContracts {
  "pseo.list": PseoListViewProps;
  "pseo.detail": PseoDetailViewProps;
}
