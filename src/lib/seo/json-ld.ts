import { siteConfig } from "@/config";

type LocaleType = "en" | "zh";

// Base URL helper
const getBaseUrl = () => siteConfig.url;

/**
 * WebSite Schema - for site-wide search/branding
 */
export function generateWebSiteSchema(locale: LocaleType) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getBaseUrl(),
    description:
      locale === "en"
        ? "Production-ready Next.js SaaS template with authentication, payments, credits, and i18n"
        : "生产就绪的 Next.js SaaS 模板，内置认证、支付、积分与国际化",
    inLanguage: locale === "en" ? "en-US" : "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getBaseUrl()}/{locale}/blog?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Organization Schema - for brand identity
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: getBaseUrl(),
    logo: `${getBaseUrl()}/logo.png`,
    sameAs: [siteConfig.links.twitter, siteConfig.links.github].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.author.email,
    },
  };
}

/**
 * Article Schema Input
 */
export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  locale: LocaleType;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  image?: string;
  tags?: string[];
}

/**
 * Article Schema - for blog posts
 */
export function generateArticleSchema(input: ArticleSchemaInput) {
  const {
    title,
    description,
    slug,
    locale,
    publishedAt,
    updatedAt,
    author,
    image,
    tags,
  } = input;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${getBaseUrl()}/${locale}/blog/${slug}`,
    inLanguage: locale === "en" ? "en-US" : "zh-CN",
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      "@type": "Person",
      name: author || siteConfig.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${getBaseUrl()}/logo.png`,
      },
    },
    ...(image && {
      image: {
        "@type": "ImageObject",
        url: image.startsWith("http") ? image : `${getBaseUrl()}${image}`,
      },
    }),
    ...(tags && tags.length > 0 && { keywords: tags.join(", ") }),
  };
}

/**
 * FAQ Item type
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * FAQ Schema - for FAQ sections
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Breadcrumb Item type
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Breadcrumb Schema - for navigation
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `${getBaseUrl()}${item.url}`,
    })),
  };
}

/**
 * SoftwareApplication Schema - for the product itself
 */
export function generateSoftwareApplicationSchema(locale: LocaleType) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: getBaseUrl(),
    description:
      locale === "en"
        ? "Production-ready Next.js SaaS template with authentication, payments, credits, and i18n"
        : "生产就绪的 Next.js SaaS 模板，内置认证、支付、积分与国际化",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: locale === "en" ? "Free tier available" : "提供免费版本",
    },
  };
}
