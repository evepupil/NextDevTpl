import { Separator } from "@/components/ui/separator";
import { getBlogPosts } from "@/lib/source";

import { BlogPostCard } from "./blog-post-card";

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
  const posts = getBlogPosts(locale);

  // 按日期排序（最新的在前）
  const sortedPosts = posts.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="container mx-auto max-w-5xl py-20">
      {/* Header */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {locale === "zh" ? "博客文章" : "Blog Posts"}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {locale === "zh"
            ? "发现 NextDevTpl 团队的最新见解、教程和更新。了解如何构建更好的 SaaS 应用程序。"
            : "Discover the latest insights, tutorials, and updates from the NextDevTpl team. Learn how to build better SaaS applications."}
        </p>
      </div>

      {/* Posts List */}
      {sortedPosts.length > 0 ? (
        <div className="space-y-12">
          {sortedPosts.map((post, index) => {
            // 从路径中提取 slug
            const pathParts = post.info.path.split("/");
            const fileName = pathParts[pathParts.length - 1] ?? "";
            const slug = fileName.replace(/\.mdx$/, "");

            return (
              <div key={post.info.path}>
                <BlogPostCard
                  slug={slug}
                  title={post.title}
                  description={post.description}
                  date={
                    typeof post.date === "string"
                      ? post.date
                      : post.date.toISOString().split("T")[0] ?? ""
                  }
                  author={post.author}
                  tags={post.tags}
                />
                {index < sortedPosts.length - 1 && (
                  <Separator className="mt-12" />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {locale === "zh" ? "暂无博客文章" : "No blog posts yet"}
        </div>
      )}
    </div>
  );
}
