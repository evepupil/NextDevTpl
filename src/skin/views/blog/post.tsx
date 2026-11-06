import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import type { BlogPostViewProps } from "@/features/blog/view";
import { Link } from "@/i18n/routing";

export function BlogPostView({
  author,
  body,
  description,
  formattedDate,
  locale,
  publishedAt,
  slug,
  tags,
  title,
}: BlogPostViewProps) {
  return (
    <article className="container mx-auto max-w-3xl py-20">
      <ArticleJsonLd
        title={title}
        description={description || ""}
        slug={slug}
        locale={locale as "en" | "zh"}
        publishedAt={publishedAt}
        {...(author && { author })}
        {...(tags && { tags: [...tags] })}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `/${locale}` },
          {
            name: locale === "zh" ? "博客" : "Blog",
            url: `/${locale}/blog`,
          },
          { name: title, url: `/${locale}/blog/${slug}` },
        ]}
      />

      <Link
        href="/blog"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← {locale === "zh" ? "返回博客" : "Back to Blog"}
      </Link>

      <header className="mb-12">
        {tags && tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          {title}
        </h1>

        {description && (
          <p className="mb-6 text-xl text-muted-foreground">{description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {author && <span>{author}</span>}
          <span>•</span>
          <time dateTime={formattedDate}>{formattedDate}</time>
        </div>
      </header>

      <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted">
        {body}
      </div>
    </article>
  );
}
