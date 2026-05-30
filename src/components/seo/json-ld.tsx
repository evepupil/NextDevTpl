import {
  type ArticleSchemaInput,
  type BreadcrumbItem,
  type FAQItem,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateWebSiteSchema,
} from "@/lib/seo/json-ld";

type LocaleType = "en" | "zh";

/**
 * Generic JSON-LD script injector
 */
function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD injection is safe
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * WebSite + Organization (typically used in layout)
 */
export function SiteJsonLd({ locale }: { locale: LocaleType }) {
  return (
    <>
      <JsonLdScript data={generateWebSiteSchema(locale)} />
      <JsonLdScript data={generateOrganizationSchema()} />
    </>
  );
}

/**
 * Article (for blog posts)
 */
export function ArticleJsonLd(props: ArticleSchemaInput) {
  return <JsonLdScript data={generateArticleSchema(props)} />;
}

/**
 * FAQ Page
 */
export function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
  if (!faqs || faqs.length === 0) return null;
  return <JsonLdScript data={generateFAQSchema(faqs)} />;
}

/**
 * Breadcrumbs
 */
export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;
  return <JsonLdScript data={generateBreadcrumbSchema(items)} />;
}

/**
 * Software Application (for product pages)
 */
export function SoftwareAppJsonLd({ locale }: { locale: LocaleType }) {
  return <JsonLdScript data={generateSoftwareApplicationSchema(locale)} />;
}

/**
 * Combined schema for homepage
 */
export function HomePageJsonLd({
  locale,
  faqs,
}: {
  locale: LocaleType;
  faqs?: FAQItem[];
}) {
  return (
    <>
      <SiteJsonLd locale={locale} />
      <SoftwareAppJsonLd locale={locale} />
      {faqs && faqs.length > 0 && <FAQJsonLd faqs={faqs} />}
    </>
  );
}
