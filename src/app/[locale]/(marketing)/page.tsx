import type { Metadata } from "next";

import { siteConfig } from "@/config";
import { SiteJsonLd, SoftwareAppJsonLd } from "@/components/seo/json-ld";
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
    ? "使用AI技术将文本、PDF、网页、视频等内容自动转换为Anki兼容的闪卡。支持多种输入格式，一键导出.apkg文件，让学习更高效。"
    : "AI-powered flashcard generator that converts text, PDFs, URLs, and videos into Anki-compatible study cards. Multiple input formats supported with one-click .apkg export.";

  return {
    title,
    description,
    keywords: [
      "AI flashcard generator",
      "Anki cards",
      "study cards",
      "spaced repetition",
      "PDF to flashcards",
      "text to Anki",
      ...(isZh
        ? ["AI闪卡生成器", "Anki卡片", "间隔重复", "PDF转闪卡"]
        : []),
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
