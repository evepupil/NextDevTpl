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
    "Modern SaaS Boilerplate with Next.js 15, TypeScript, Tailwind CSS, and more. Ship your product faster.",

  /** 站点 URL (生产环境) */
  url: process.env.NEXT_PUBLIC_APP_URL || "https://nextdevtpl.com",

  /** OG 图片 URL */
  ogImage: "/og-image.png",

  /** 作者信息 */
  author: {
    name: "NextDevTpl Team",
    url: "https://nextdevtpl.com",
    email: "hello@nextdevtpl.com",
  },

  /** 社交链接 */
  links: {
    twitter: "https://twitter.com/nextdevtpl",
    github: "https://github.com/nextdevtpl/nextdevtpl",
    discord: "https://discord.gg/nextdevtpl",
  },

  /** 关键词 (SEO) */
  keywords: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "SaaS",
    "Boilerplate",
    "Starter Kit",
  ],
} as const;

/**
 * 站点配置类型
 */
export type SiteConfig = typeof siteConfig;
