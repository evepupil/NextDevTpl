import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/routing";
import { getAllBlogSlugs, getBlogPost } from "@/lib/source";

/**
 * 生成静态参数
 */
export function generateStaticParams() {
  return getAllBlogSlugs();
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
  const post = getBlogPost(slug, locale);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
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

  return (
    <article className="container mx-auto max-w-3xl py-20">
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
                className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900 dark:text-violet-300"
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
      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-violet-600 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted">
        <MDXContent />
      </div>
    </article>
  );
}
