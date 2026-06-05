import type { MetadataRoute } from "next";

import { siteConfig } from "@/config";
import { getAllPseoParams } from "@/features/pseo/lib/pseo-data";
import { getAllBlogSlugs, getAllLegalSlugs } from "@/lib/source";

/** Supported locales */
const locales = ["en", "zh"] as const;

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
    "/pseo",
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

  // Blog posts (dynamic)
  const blogSlugs = getAllBlogSlugs();
  const blogRoutes = blogSlugs.map(
    ({ locale, slug }: { locale: string; slug: string }) => ({
      url: `${baseUrl}/${locale}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  // Legal pages (dynamic)
  const legalSlugs = getAllLegalSlugs();
  const legalRoutes = legalSlugs.map(
    ({ locale, slug }: { locale: string; slug: string }) => ({
      url: `${baseUrl}/${locale}/legal/${slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })
  );

  const pseoSlugs = getAllPseoParams();
  const pseoRoutes = pseoSlugs.map(({ locale, slug }) => ({
    url: `${baseUrl}/${locale}/pseo/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes, ...legalRoutes, ...pseoRoutes];
}
