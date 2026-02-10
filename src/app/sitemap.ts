import type { MetadataRoute } from "next";

import { siteConfig } from "@/config";
import { getAllBlogSlugs, getAllLegalSlugs } from "@/lib/source";

/** Supported locales */
const locales = ["en", "zh"] as const;

/** Solution types */
const solutionTypes = ["text", "pdf", "url", "video", "word", "markdown"] as const;

/**
 * 动态生成 sitemap.xml
 *
 * 包含所有公开页面的 URL
 * 用于搜索引擎索引
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();

  // Static pages that exist for each locale
  const staticPaths = [
    "", // homepage
    "/blog",
  ];

  // Generate static routes for each locale
  const staticRoutes = locales.flatMap((locale) =>
    staticPaths.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }))
  );

  // Solution pages for each locale
  const solutionRoutes = locales.flatMap((locale) =>
    solutionTypes.map((type) => ({
      url: `${baseUrl}/${locale}/solutions/${type}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    }))
  );

  // Blog posts (dynamic)
  const blogSlugs = getAllBlogSlugs();
  const blogRoutes = blogSlugs.map(({ locale, slug }) => ({
    url: `${baseUrl}/${locale}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Legal pages (dynamic)
  const legalSlugs = getAllLegalSlugs();
  const legalRoutes = legalSlugs.map(({ locale, slug }) => ({
    url: `${baseUrl}/${locale}/legal/${slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [...staticRoutes, ...solutionRoutes, ...blogRoutes, ...legalRoutes];
}
