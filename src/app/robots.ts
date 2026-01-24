import type { MetadataRoute } from "next";

import { siteConfig } from "@/config";

/**
 * 动态生成 robots.txt
 *
 * 允许所有搜索引擎爬虫访问
 * 指向 sitemap.xml
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
