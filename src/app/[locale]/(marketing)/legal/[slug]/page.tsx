import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/routing";
import { getAllLegalSlugs, getLegalDoc } from "@/lib/source";

/**
 * 生成静态参数
 * 用于预渲染所有法律文档页面
 */
export function generateStaticParams() {
  return getAllLegalSlugs();
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
  const doc = getLegalDoc(slug, locale);
  const t = await getTranslations({ locale, namespace: "Legal" });

  if (!doc) {
    return {
      title: t("notFound"),
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
  const doc = getLegalDoc(slug, locale);
  const t = await getTranslations("Legal");

  // 文档不存在时返回 404
  if (!doc) {
    notFound();
  }

  // 获取 MDX 内容组件
  const MDXContent = doc.body;

  // 格式化日期
  const formattedDate =
    typeof doc.date === "string"
      ? doc.date
      : doc.date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  return (
    <article className="container mx-auto max-w-3xl py-12">
      {/* 返回链接 */}
      <Link
        href="/"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t("back")}
      </Link>

      {/* 文档头部 */}
      <header className="mb-8 border-b pb-8">
        {/* 标题 */}
        <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          {doc.title}
        </h1>

        {/* 最后更新日期 */}
        <p className="text-sm text-muted-foreground">
          {t("lastUpdated")}
          <time dateTime={formattedDate}>{formattedDate}</time>
        </p>
      </header>

      {/* 文档内容 - 使用 Tailwind Typography 样式 */}
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-8 prose-h3:text-lg prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-th:bg-muted prose-th:p-2 prose-td:p-2 prose-td:border">
        <MDXContent />
      </div>

      {/* 底部导航 */}
      <footer className="mt-12 border-t pt-8">
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">
            {t("otherDocs")}
          </span>
          {slug !== "terms" && (
            <Link
              href="/legal/terms"
              className="text-violet-600 hover:underline"
            >
              {t("links.terms")}
            </Link>
          )}
          {slug !== "privacy" && (
            <Link
              href="/legal/privacy"
              className="text-violet-600 hover:underline"
            >
              {t("links.privacy")}
            </Link>
          )}
          {slug !== "cookie-policy" && (
            <Link
              href="/legal/cookie-policy"
              className="text-violet-600 hover:underline"
            >
              {t("links.cookie")}
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
