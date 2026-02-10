/**
 * 站点配置
 *
 * 集中管理站点的基本信息，用于 SEO、元数据、页脚等
 */
export const siteConfig = {
  /** 站点名称 */
  name: "NextDevTpl",

  /** 站点描述 */
  description:
    "Production-ready Next.js SaaS template with auth, payments, credits, i18n, and more.",

  /** 站点 URL (生产环境) */
  url: process.env.NEXT_PUBLIC_APP_URL || "https://example.com",

  /** OG 图片 URL */
  ogImage: "/og-image.png",

  /** 作者信息 */
  author: {
    name: "NextDevTpl Team",
    url: "https://example.com",
    email: "hello@example.com",
  },

  /** 社交链接 */
  links: {
    twitter: "https://twitter.com/example",
    github: "https://github.com/example/nextdevtpl",
    discord: "https://discord.gg/example",
  },

  /** 关键词 (SEO) */
  keywords: [
    "SaaS",
    "Next.js",
    "Template",
    "Boilerplate",
    "Starter Kit",
    "Auth",
    "Payments",
  ],
} as const;

/**
 * 站点配置类型
 */
export type SiteConfig = typeof siteConfig;
