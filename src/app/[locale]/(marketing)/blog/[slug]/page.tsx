import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config";
import {
  getAllBlogStaticParams,
  getBlogPostMetadataData,
  getBlogPostViewData,
} from "@/features/blog/server";
import { skinViews } from "@/modules/skin-views";

/**
 * 生成静态参数
 */
export function generateStaticParams() {
  return getAllBlogStaticParams();
}

/**
 * 生成页面元数据 (enhanced with article metadata)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getBlogPostMetadataData(locale, slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const url = `${siteConfig.url}/${locale}/blog/${slug}`;
  const languages = Object.fromEntries(
    post.locales.map((postLocale) => [
      postLocale,
      `${siteConfig.url}/${postLocale}/blog/${slug}`,
    ])
  );

  return {
    title: post.title,
    description: post.description,
    authors: post.author ? [{ name: post.author }] : undefined,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url,
      siteName: siteConfig.name,
      publishedTime: post.publishedDate,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
      images: [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: url,
      languages,
    },
  };
}

/**
 * 博客文章详情页面
 */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const props = getBlogPostViewData(locale, slug);
  if (!props) {
    notFound();
  }
  const View = skinViews["blog.post"];

  return <View {...props} />;
}
