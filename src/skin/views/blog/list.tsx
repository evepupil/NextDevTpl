import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { Separator } from "@/components/ui/separator";
import type { BlogListViewProps } from "@/features/blog/view";

import { BlogPostCard } from "./components/blog-post-card";

export function BlogListView({ locale, posts }: BlogListViewProps) {
  return (
    <div className="container mx-auto max-w-5xl py-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: `/${locale}` },
          {
            name: locale === "zh" ? "博客" : "Blog",
            url: `/${locale}/blog`,
          },
        ]}
      />

      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {locale === "zh" ? "博客文章" : "Blog Posts"}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {locale === "zh"
            ? "发现 NextDevTpl 团队的最新见解、教程和更新。了解产品最新动态。"
            : "Discover the latest insights, tutorials, and updates from the NextDevTpl team. Learn about the latest product news."}
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="space-y-12">
          {posts.map((post, index) => (
            <div key={post.slug}>
              <BlogPostCard {...post} />
              {index < posts.length - 1 && <Separator className="mt-12" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {locale === "zh" ? "暂无博客文章" : "No blog posts yet"}
        </div>
      )}
    </div>
  );
}
