import type { Metadata } from "next";
import { siteConfig } from "@/config";
import { getBlogListViewData } from "@/features/blog/server";
import { skinViews } from "@/modules/skin-views";

/**
 * 生成博客列表页 Metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === "zh";

  const title = isZh ? "博客文章" : "Blog Posts";
  const description = isZh
    ? "发现 NextDevTpl 团队的最新见解、教程和更新。了解产品最新动态。"
    : "Discover the latest insights, tutorials, and updates from the NextDevTpl team. Learn about the latest product news.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteConfig.url}/${locale}/blog`,
      siteName: siteConfig.name,
    },
    alternates: {
      canonical: `${siteConfig.url}/${locale}/blog`,
      languages: {
        en: `${siteConfig.url}/en/blog`,
        zh: `${siteConfig.url}/zh/blog`,
      },
    },
  };
}

/**
 * 博客列表页面
 *
 * 显示当前语言的所有博客文章
 */
export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const props = getBlogListViewData(locale);
  const View = skinViews["blog.list"];

  return <View {...props} />;
}
