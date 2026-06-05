import type { Metadata } from "next";
import { SiteJsonLd, SoftwareAppJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config";
import {
  CTASection,
  FAQSection,
  FeatureGrid,
  HeroSection,
  HowItWorks,
  PricingSection,
  Testimonials,
  UseCasesSection,
} from "@/features/marketing/components";

/**
 * 生成首页 Metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === "zh";

  const title = isZh
    ? "NextDevTpl - 生产就绪的 Next.js SaaS 模板"
    : "NextDevTpl - Production-ready Next.js SaaS Template";

  const description = isZh
    ? "生产就绪的 Next.js SaaS 模板，内置认证、支付、积分系统、后台任务、国际化与管理后台。克隆、定制、即可上线。"
    : "Production-ready Next.js SaaS template with authentication, payments, a credits system, background jobs, i18n, and an admin panel. Clone, customize, and ship.";

  return {
    title,
    description,
    keywords: [
      "Next.js SaaS template",
      "SaaS boilerplate",
      "Next.js starter kit",
      "Better Auth",
      "Drizzle ORM",
      "TypeScript SaaS",
      ...(isZh ? ["Next.js SaaS 模板", "SaaS 脚手架", "SaaS 样板"] : []),
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/${locale}`,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <SiteJsonLd locale={locale as "en" | "zh"} />
      <SoftwareAppJsonLd locale={locale as "en" | "zh"} />

      {/* Page Sections */}
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <UseCasesSection />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
