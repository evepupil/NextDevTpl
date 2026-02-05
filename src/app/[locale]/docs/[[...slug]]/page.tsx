import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { docsSource } from "@/lib/source";

/**
 * 生成静态参数
 */
export function generateStaticParams() {
  return docsSource.generateParams();
}

/**
 * 生成页面元数据
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = docsSource.getPage(slug);
  const t = await getTranslations({ locale, namespace: "Docs" });

  if (!page) {
    return {
      title: t("notFound"),
    };
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

/**
 * 文档页面
 *
 * 使用 Fumadocs UI 的 DocsPage 组件
 * 渲染 MDX 内容
 */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug?: string[] }>;
}) {
  const { slug } = await params;
  const page = docsSource.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <MDXContent />
      </DocsBody>
    </DocsPage>
  );
}
