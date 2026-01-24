import type { MetadataRoute } from "next";

import { siteConfig } from "@/config";

/**
 * 动态生成 sitemap.xml
 *
 * 包含所有公开页面的 URL
 * 用于搜索引擎索引
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;

  // 静态页面
  const staticPages = [
    "",
    "/about",
    "/pricing",
    "/blog",
    "/docs",
    "/features",
    "/changelog",
    "/privacy",
    "/terms",
  ];

  // 生成 sitemap 条目
  const routes = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // TODO: 添加动态页面 (博客文章、文档页面等)
  // const blogPosts = await getBlogPosts();
  // const blogRoutes = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: "monthly" as const,
  //   priority: 0.6,
  // }));

  return routes;
}
