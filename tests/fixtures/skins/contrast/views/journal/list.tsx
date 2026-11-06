import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import type { BlogListViewProps } from "@/features/blog/view";
import { Link } from "@/i18n/routing";

export function BlogList({ locale, posts }: BlogListViewProps) {
  const t = useTranslations("Common");
  return (
    <main
      className="mx-auto w-full max-w-6xl px-4 py-10"
      data-locale={locale}
      data-skin-view="blog.list"
    >
      <header className="mb-8 border-b border-border pb-6">
        <p className="font-mono text-xs font-semibold uppercase text-primary">
          {locale === "zh" ? "NextDevTpl / 博客" : "NextDevTpl / Journal"}
        </p>
        <h1 className="mt-2 break-words font-mono text-3xl font-semibold">
          {t("blog")}
        </h1>
        {posts[0]?.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {posts[0].description}
          </p>
        )}
      </header>
      {posts.length === 0 ? (
        <p className="border-y border-border py-8 text-sm text-muted-foreground">
          {locale === "zh" ? "暂无文章" : "No posts yet"}
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {posts.map((post) => (
            <article
              className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_12rem]"
              key={post.slug}
            >
              <div className="min-w-0">
                <h2 className="break-words font-mono text-xl font-semibold">
                  <Link
                    className="underline-offset-4 hover:text-primary hover:underline"
                    href={"/blog/" + post.slug}
                  >
                    {post.title}
                  </Link>
                </h2>
                {post.description && (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {post.description}
                  </p>
                )}
                {post.tags && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <li
                        className="border border-border px-2 py-1 text-xs"
                        key={tag}
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-end justify-between gap-3 text-xs text-muted-foreground md:flex-col md:items-end">
                <time dateTime={post.date}>{post.date}</time>
                {post.author && (
                  <span className="break-words">{post.author}</span>
                )}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
