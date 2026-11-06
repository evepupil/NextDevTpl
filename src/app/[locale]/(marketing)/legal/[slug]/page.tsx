import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  getAllMarketingLegalStaticParams,
  getMarketingLegalMetadataData,
  getMarketingLegalViewData,
} from "@/features/marketing/server";
import { skinViews } from "@/modules/skin-views";

/**
 * 生成静态参数
 * 用于预渲染所有法律文档页面
 */
export function generateStaticParams() {
  return getAllMarketingLegalStaticParams();
}

/**
 * 生成页面元数据
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const doc = getMarketingLegalMetadataData(locale, slug);

  if (!doc) {
    return {
      title: "Document Not Found",
    };
  }

  return {
    title: doc.title,
    description: doc.description,
  };
}

/**
 * 法律文档详情页面
 *
 * 路由: /legal/[slug]
 * 支持: /legal/terms, /legal/privacy, /legal/cookie-policy
 */
export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const props = getMarketingLegalViewData(locale, slug);
  if (!props) {
    notFound();
  }

  const View = skinViews["marketing.legal"];
  return <View {...props} />;
}
