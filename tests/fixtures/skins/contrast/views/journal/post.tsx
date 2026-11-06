import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import type { BlogPostViewProps } from "@/features/blog/view";
import { Link } from "@/i18n/routing";

export function BlogPost({
  locale,
  slug,
  title,
  description,
  author,
  tags,
  formattedDate,
  publishedAt,
  body,
}: BlogPostViewProps) {
  const t = useTranslations("Common");
  return (
    <main
      className="mx-auto w-full max-w-3xl px-4 py-10"
      data-locale={locale}
      data-skin-view="blog.post"
    >
      <Link
        className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
        href="/blog"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("blog")}
      </Link>
      <article className="mt-6">
        <p className="font-mono text-xs uppercase text-primary">{slug}</p>
        <h1 className="mt-3 break-words font-mono text-3xl font-semibold">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            {description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3 border-y border-border py-3 text-xs text-muted-foreground">
          <time dateTime={publishedAt}>{formattedDate}</time>
          {author && <span className="break-words">{author}</span>}
          {tags?.map((tag) => (
            <span className="border border-border px-2 py-1" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="prose prose-sm mt-8 max-w-none break-words text-foreground">
          {body}
        </div>
      </article>
    </main>
  );
}
