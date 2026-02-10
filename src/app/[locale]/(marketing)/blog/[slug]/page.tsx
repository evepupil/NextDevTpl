import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { siteConfig } from "@/config";
import { Link } from "@/i18n/routing";
import { getAllBlogSlugs, getBlogPost } from "@/lib/source";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

/**
 * 生成静态参数
 */
export function generateStaticParams() {
  return getAllBlogSlugs();
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
  const post = getBlogPost(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const publishedDate =
    typeof post.date === "string" ? post.date : post.date.toISOString();

  const url = `${siteConfig.url}/${locale}/blog/${slug}`;

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
      publishedTime: publishedDate,
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
      languages: {
        en: `${siteConfig.url}/en/blog/${slug}`,
        zh: `${siteConfig.url}/zh/blog/${slug}`,
      },
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
  const post = getBlogPost(slug, locale);

  if (!post) {
    notFound();
  }

  // 获取 MDX 内容组件
  const MDXContent = post.body;

  // 格式化日期
  const formattedDate =
    typeof post.date === "string"
      ? post.date
      : post.date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  const isoDate =
    typeof post.date === "string" ? post.date : post.date.toISOString();

  return (
    <article className="container mx-auto max-w-3xl py-20">
      {/* JSON-LD Structured Data */}
      <ArticleJsonLd
        title={post.title}
        description={post.description || ""}
        slug={slug}
        locale={locale as "en" | "zh"}
        publishedAt={isoDate}
        {...(post.author && { author: post.author })}
        {...(post.tags && { tags: post.tags })}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `/${locale}` },
          {
            name: locale === "zh" ? "博客" : "Blog",
            url: `/${locale}/blog`,
          },
          { name: post.title, url: `/${locale}/blog/${slug}` },
        ]}
      />

      {/* 返回链接 */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← {locale === "zh" ? "返回博客" : "Back to Blog"}
      </Link>

      {/* 文章头部 */}
      <header className="mb-12">
        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 标题 */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          {post.title}
        </h1>

        {/* 描述 */}
        {post.description && (
          <p className="mb-6 text-xl text-muted-foreground">
            {post.description}
          </p>
        )}

        {/* 元数据 */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {post.author && <span>{post.author}</span>}
          <span>•</span>
          <time dateTime={formattedDate}>{formattedDate}</time>
        </div>
      </header>

      {/* 文章内容 */}
      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted">
        <MDXContent />
      </div>
    </article>
  );
}
