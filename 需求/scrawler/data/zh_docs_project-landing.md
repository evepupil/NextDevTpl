# 来源: https://nextdevkit.com/zh/docs/project-landing

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
Landing Page 启动配置快速启动：5 分钟上手
# Landing Page 启动配置
从最小启动到完整配置的渐进式指南，帮助你快速启动和定制 NEXTDEVKIT Landing Page。
本指南将指导你通过最小配置启动 NEXTDEVKIT，并逐步定制你的 Landing Page。你可以实时看到每个配置的效果。
## [快速启动：5 分钟上手](https://nextdevkit.com/zh/docs/project-landing#%E5%BF%AB%E9%80%9F%E5%90%AF%E5%8A%A85-%E5%88%86%E9%92%9F%E4%B8%8A%E6%89%8B)
让我们用最少的配置启动你的 NEXTDEVKIT。
### [步骤 1：最小环境变量](https://nextdevkit.com/zh/docs/project-landing#%E6%AD%A5%E9%AA%A4-1%E6%9C%80%E5%B0%8F%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
在项目根目录创建 `.env.local` 文件，包含这些必要变量：
.env.local
```
# 数据库 (必需)
DATABASE_URL="postgresql://user:password@localhost:5432/nextdevkit"
# Better Auth 认证 (必需)
BETTER_AUTH_SECRET="your-random-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
# 公共 URL (必需)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**生成安全密钥：**
```
openssl rand -base64 32
```

### [步骤 2：启动开发服务器](https://nextdevkit.com/zh/docs/project-landing#%E6%AD%A5%E9%AA%A4-2%E5%90%AF%E5%8A%A8%E5%BC%80%E5%8F%91%E6%9C%8D%E5%8A%A1%E5%99%A8)
```
# 安装依赖
pnpm install
# 启动开发服务器
pnpm dev
```

你的应用现在应该运行在 `http://localhost:3000` 🎉
你会看到一个带有默认内容的基础 Landing Page。现在让我们逐步定制它！
## [渐进式配置之旅](https://nextdevkit.com/zh/docs/project-landing#%E6%B8%90%E8%BF%9B%E5%BC%8F%E9%85%8D%E7%BD%AE%E4%B9%8B%E6%97%85)
让我们按照项目架构的渐进式方法定制你的 Landing Page。每一步都建立在前一步的基础上，你可以立即看到变化。
### [第一层：品牌标识](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%B8%80%E5%B1%82%E5%93%81%E7%89%8C%E6%A0%87%E8%AF%86)
**目标：** 用你自己的品牌替换默认品牌。
**配置内容：**
  * 应用名称和元数据
  * Logo 图片
  * 颜色主题


**需要编辑的文件：**
#### [更新基础元数据](https://nextdevkit.com/zh/docs/project-landing#%E6%9B%B4%E6%96%B0%E5%9F%BA%E7%A1%80%E5%85%83%E6%95%B0%E6%8D%AE)
编辑 `src/config/index.ts`：
src/config/index.ts
```
export const appConfig = {
  metadata: {
    name: "你的应用名称",                    // 修改这里
    description: "你的应用描述",             // 修改这里
    url: "https://yourapp.com",            // 修改这里
    images: {
      logoLight: "/logo-light.svg",        // 上传你的浅色主题 Logo
      logoDark: "/logo-dark.svg",          // 上传你的深色主题 Logo
      ogImage: "/og-image.png",            // 社交分享图片
    },
  },
  // ... 其余配置
}
```

**看看效果：** 刷新页面 - 你的应用名称现在出现在页头了！
#### [自定义颜色主题](https://nextdevkit.com/zh/docs/project-landing#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%A2%9C%E8%89%B2%E4%B8%BB%E9%A2%98)
NEXTDEVKIT 完全兼容 Tailwind CSS 主题。使用 
  1. 访问 
  2. 选择并调整你喜欢的配色方案
  3. 复制生成的代码
  4. 粘贴到 `src/app/globals.css`，替换 `:root`、`.dark` 和 `@theme inline` 块


或者使用 shadcn 命令：
```
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/claude.json
```

**看看效果：** 整个网站现在使用你的自定义配色方案了！
#### [配置暗黑模式](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%9A%97%E9%BB%91%E6%A8%A1%E5%BC%8F)
选择是否启用主题切换：
src/config/index.ts
```
ui: {
  theme: {
    enabled: true,              // 启用主题切换
    defaultMode: "system",      // "system" | "light" | "dark"
  },
}
```

**看看效果：** 主题切换按钮出现在页头。试试在明暗模式之间切换！
### [第二层：Hero 主页横幅](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%BA%8C%E5%B1%82hero-%E4%B8%BB%E9%A1%B5%E6%A8%AA%E5%B9%85)
**目标：** 定制 Landing Page 的 Hero 部分。
**配置内容：**
  * Hero 标题和描述
  * 行动号召按钮
  * 徽章/公告文本


#### [编辑 Hero 内容](https://nextdevkit.com/zh/docs/project-landing#%E7%BC%96%E8%BE%91-hero-%E5%86%85%E5%AE%B9)
更新 `messages/zh.json` 中的翻译：
messages/zh.json
```
{
  "hero": {
    "badge": "新功能",
    "badgeText": "介绍全新的 AI 模型支持",
    "heading": "更快构建您的 SaaS 产品",
    "subHeading": "生产就绪的 Next.js 模板，包含认证、支付等功能",
    "buttons": {
      "getStarted": "开始使用",
      "seeDemo": "查看演示"
    }
  }
}
```

对于英文版本，编辑 `messages/en.json`：
messages/en.json
```
{
  "hero": {
    "badge": "New Feature",
    "badgeText": "Introducing AI Model Support",
    "heading": "Build Your SaaS Product Faster",
    "subHeading": "Production-ready Next.js template with authentication, payments, and more",
    "buttons": {
      "getStarted": "Get Started",
      "seeDemo": "See Demo"
    }
  }
}
```

**看看效果：** Hero 部分现在显示你的自定义标题和描述！
#### [配置按钮链接](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%8C%89%E9%92%AE%E9%93%BE%E6%8E%A5)
编辑 `src/config/marketing/hero-section.ts`：
src/config/marketing/hero-section.ts
```
export function getHeroSectionConfig() {
  return {
    links: {
      badge: "/blog",                  // 徽章点击跳转
      getStarted: "/#pricing",         // 主要 CTA
      seeDemo: "/app/dashboard",       // 次要 CTA
    },
  };
}
```

**看看效果：** 点击 Hero 按钮 - 它们现在跳转到你指定的页面！
### [第三层：功能展示](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%B8%89%E5%B1%82%E5%8A%9F%E8%83%BD%E5%B1%95%E7%A4%BA)
**目标：** 突出显示产品的关键功能。
**配置内容：**
  * 功能标签页或步骤
  * 功能描述
  * 功能图片


NEXTDEVKIT 提供两种内置功能展示类型：
#### [配置功能标签页](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E5%8A%9F%E8%83%BD%E6%A0%87%E7%AD%BE%E9%A1%B5)
适合通过交互式标签页展示不同功能特性。
更新 `messages/zh.json`：
messages/zh.json
```
{
  "featureSection": {
    "tabs": {
      "heading": "强大功能集合",
      "description": "构建完美解决方案",
      "items": {
        "tab-1": {
          "label": "自定义主题",
          "content": {
            "badge": "美观现代",
            "title": "轻松自定义主题",
            "description": "美观现代的样式，几行代码即可更改颜色、字体和布局",
            "buttonText": "查看主题"
          }
        },
        "tab-2": {
          "label": "身份认证",
          "content": {
            "badge": "安全灵活",
            "title": "完整认证系统",
            "description": "内置认证系统，支持社交登录、魔法链接和邮箱验证",
            "buttonText": "了解更多"
          }
        }
      }
    }
  }
}
```

在 `src/config/marketing/feature-tabs.ts` 中配置图标和链接：
src/config/marketing/feature-tabs.ts
```
import { Zap, Shield } from "lucide-react";
const featureTabs: FeatureTabItem[] = [
  {
    value: "tab-1",
    label: t("items.tab-1.label"),
    icon: Zap,                              // Lucide 图标
    content: {
      // ... 其他内容
      imageSrc: "/marketing/feature-themes.png",
      link: "/docs/themes",
    },
  },
  {
    value: "tab-2",
    label: t("items.tab-2.label"),
    icon: Shield,
    content: {
      imageSrc: "/marketing/feature-auth.png",
      link: "/docs/authentication",
    },
  },
];
```

**看看效果：** 滚动到功能部分 - 你的自定义标签页出现了，可以交互切换！
#### [配置功能步骤](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E5%8A%9F%E8%83%BD%E6%AD%A5%E9%AA%A4)
适合展示使用流程和入门指南。
更新 `messages/zh.json`：
messages/zh.json
```
{
  "featureSection": {
    "steps": {
      "title": "快速开始",
      "items": {
        "step-1": {
          "step": "第一步",
          "title": "克隆模板",
          "content": "从 GitHub 克隆 Next.js 入门模板"
        },
        "step-2": {
          "step": "第二步",
          "title": "配置项目",
          "content": "设置环境变量并自定义模板"
        },
        "step-3": {
          "step": "第三步",
          "title": "部署",
          "content": "一键部署到 Vercel、Cloudflare 或 AWS"
        }
      }
    }
  }
}
```

**看看效果：** 你的分步指南现在向用户展示如何开始使用！
### [第四层：社会证明](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E5%9B%9B%E5%B1%82%E7%A4%BE%E4%BC%9A%E8%AF%81%E6%98%8E)
**目标：** 通过推荐和 FAQ 建立信任。
**配置内容：**
  * 客户推荐
  * 常见问题
  * 支持信息


#### [添加客户推荐](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E5%AE%A2%E6%88%B7%E6%8E%A8%E8%8D%90)
编辑 `messages/zh.json`：
messages/zh.json
```
{
  "testimonials": {
    "title": "深受全球用户信赖",
    "description": "加入成千上万满意用户的行列",
    "items": {
      "testimonial-1": {
        "author": {
          "name": "张三",
          "handle": "@zhangsan",
          "avatar": "https://example.com/avatar1.jpg"
        },
        "text": "这个平台完全改变了我们处理数据的方式。速度和准确性都令人印象深刻。",
        "href": "https://twitter.com/zhangsan"
      },
      "testimonial-2": {
        "author": {
          "name": "李四",
          "handle": "@lisi",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "text": "我经历过的最好的开发体验。一切都能开箱即用。",
        "href": "https://twitter.com/lisi"
      }
    }
  }
}
```

**看看效果：** 推荐部分现在显示你的客户评价！
#### [配置 FAQ 部分](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE-faq-%E9%83%A8%E5%88%86)
编辑 `messages/zh.json`：
messages/zh.json
```
{
  "faq": {
    "heading": "常见问题",
    "description": "关于我们产品的一切信息",
    "items": {
      "faq-1": {
        "id": "faq-1",
        "question": "我可以免费试用吗？",
        "answer": "是的，我们提供 14 天免费试用。试用期间可以随时取消，不会被收费。"
      },
      "faq-2": {
        "id": "faq-2",
        "question": "如何取消订阅？",
        "answer": "您可以随时在账户设置中取消订阅。"
      },
      "faq-3": {
        "id": "faq-3",
        "question": "支持哪些支付方式？",
        "answer": "我们接受所有主要信用卡和 PayPal 付款。"
      }
    },
    "supportHeading": "还有其他问题？",
    "supportDescription": "找不到您要的答案？我们的支持团队随时为您提供帮助。",
    "supportButtonText": "联系支持"
  }
}
```

**看看效果：** FAQ 部分现在回答客户的常见问题！
### [第五层：定价配置](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%BA%94%E5%B1%82%E5%AE%9A%E4%BB%B7%E9%85%8D%E7%BD%AE)
**目标：** 展示定价计划并启用支付。
**所需内容：**
  * 支付提供商设置（Stripe 或 Creem）
  * 定价计划配置
  * 计划描述


#### [设置支付提供商](https://nextdevkit.com/zh/docs/project-landing#%E8%AE%BE%E7%BD%AE%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86)
在 `.env.local` 中添加支付凭据：
.env.local
```
# Stripe
STRIPE_SECRET_KEY="sk_test_your_key"
STRIPE_WEBHOOK_SECRET="whsec_your_secret"
# 价格 ID
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="price_xxx"
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="price_xxx"
NEXT_PUBLIC_PRICE_ID_LIFETIME="price_xxx"
```

#### [配置支付计划](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%94%AF%E4%BB%98%E8%AE%A1%E5%88%92)
编辑 `src/config/index.ts`：
src/config/index.ts
```
payment: {
  provider: "stripe",              // 或 "creem"
  currency: "USD",
  yearlyDiscount: 20,              // 年付 20% 折扣
  redirectAfterCheckout: "/app/dashboard",
  plans: {
    free: {
      id: "free",
      isFree: true,
    },
    pro: {
      id: "pro",
      prices: [
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY as string,
          amount: 9.9,
          interval: PlanInterval.MONTH,
          trialPeriodDays: 7,
        },
        {
          type: PaymentType.SUBSCRIPTION,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID_PRO_YEARLY as string,
          amount: 99,
          interval: PlanInterval.YEAR,
          trialPeriodDays: 30,
        },
      ],
      popular: true,
    },
    lifetime: {
      id: "lifetime",
      prices: [
        {
          type: PaymentType.ONE_TIME,
          priceId: process.env.NEXT_PUBLIC_PRICE_ID_LIFETIME as string,
          amount: 399,
        },
      ],
      isLifetime: true,
    },
  },
}
```

#### [添加计划描述](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E8%AE%A1%E5%88%92%E6%8F%8F%E8%BF%B0)
在 `messages/zh.json` 中配置计划信息：
messages/zh.json
```
{
  "pricing": {
    "title": "简单透明的定价",
    "subtitle": "选择适合您的计划",
    "frequencies": {
      "monthly": "月付",
      "yearly": "年付"
    },
    "products": {
      "free": {
        "title": "免费版",
        "description": "适合试用",
        "features": {
          "feature1": "基础功能",
          "feature2": "最多 10 个项目",
          "feature3": "社区支持"
        }
      },
      "pro": {
        "title": "专业版",
        "description": "适合专业人士",
        "features": {
          "feature1": "所有免费版功能",
          "feature2": "无限项目",
          "feature3": "优先支持",
          "feature4": "高级分析"
        }
      },
      "lifetime": {
        "title": "终身版",
        "description": "一次付费，永久使用",
        "features": {
          "feature1": "所有专业版功能",
          "feature2": "终身更新",
          "feature3": "无订阅费用"
        }
      }
    }
  }
}
```

**看看效果：** 访问 `/pricing` 查看你漂亮的定价表！
### [第六层：导航和页脚](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E5%85%AD%E5%B1%82%E5%AF%BC%E8%88%AA%E5%92%8C%E9%A1%B5%E8%84%9A)
**目标：** 用导航和页脚完善网站结构。
#### [配置导航菜单](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E5%AF%BC%E8%88%AA%E8%8F%9C%E5%8D%95)
编辑 `messages/zh.json`：
messages/zh.json
```
{
  "navigation": {
    "products": {
      "label": "产品"
    },
    "blog": {
      "label": "博客"
    },
    "docs": {
      "label": "文档"
    },
    "pricing": {
      "label": "定价"
    }
  }
}
```

在 `src/config/navigation.ts` 中自定义导航结构：
src/config/navigation.ts
```
export function getNavItems(): NavItem[] {
  const t = useTranslations("navigation");
  return [
    {
      id: 1,
      label: t("blog.label"),
      link: "/blog",
    },
    {
      id: 2,
      label: t("docs.label"),
      link: "/docs",
    },
    {
      id: 3,
      label: t("pricing.label"),
      link: "/pricing",
    },
  ];
}
```

**看看效果：** 你的自定义导航菜单出现在页头了！
#### [配置页脚](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E9%A1%B5%E8%84%9A)
编辑 `src/config/footer.ts`：
src/config/footer.ts
```
export function getFooterData(): FooterData {
  const t = useTranslations("footer");
  return {
    newsletter: {
      title: t("newsletter.title"),
      description: t("newsletter.description"),
      inputPlaceholder: t("newsletter.inputPlaceholder"),
      submitAriaLabel: t("newsletter.submitAriaLabel"),
    },
    quickLinks: {
      title: t("quickLinks.title"),
      links: [
        { label: t("quickLinks.home"), href: "/#hero" },
        { label: t("quickLinks.features"), href: "/#feature-tabs" },
        { label: t("quickLinks.pricing"), href: "/pricing" },
      ],
    },
    resources: {
      title: t("resources.title"),
      links: [
        { label: t("resources.docs"), href: "/docs" },
        { label: t("resources.blog"), href: "/blog" },
        { label: t("resources.contact"), href: "/contact" },
      ],
    },
  };
}
```

在 `messages/zh.json` 中添加页脚翻译：
messages/zh.json
```
{
  "footer": {
    "newsletter": {
      "title": "订阅我们的通讯",
      "description": "获取最新更新和独家优惠",
      "inputPlaceholder": "输入您的邮箱",
      "submitAriaLabel": "订阅"
    },
    "quickLinks": {
      "title": "快速链接",
      "home": "首页",
      "features": "功能特色",
      "pricing": "定价"
    },
    "resources": {
      "title": "资源",
      "docs": "文档",
      "blog": "博客",
      "contact": "联系我们"
    },
    "copyright": "© 2025 你的公司. 保留所有权利。"
  }
}
```

**看看效果：** 滚动到底部 - 包含邮件订阅的完整页脚！
#### [添加社交媒体链接](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E7%A4%BE%E4%BA%A4%E5%AA%92%E4%BD%93%E9%93%BE%E6%8E%A5)
在 `src/config/social-media.tsx` 中配置：
src/config/social-media.tsx
```
import { SocialMediaIcons as Icons } from "@/components/icons/social-media";
import GitHub from "@/components/icons/social-media/github";
export function getSocialMediaData() {
  const t = useTranslations("footer");
  return {
    title: t("social.title"),
    media: [
      {
        name: "GitHub",
        href: "https://github.com/yourusername",
        icon: <GitHub className="h-4 w-4" />,
      },
      {
        name: "X",
        href: "https://x.com/yourusername",
        icon: <Icons.X className="h-4 w-4" />,
      },
      {
        name: "LinkedIn",
        href: "https://linkedin.com/company/yourcompany",
        icon: <Icons.LinkedIn className="h-4 w-4" />,
      },
    ],
  };
}
```

**看看效果：** 社交媒体图标出现在页脚中！
## [配置检查清单](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%A3%80%E6%9F%A5%E6%B8%85%E5%8D%95)
使用这个清单确保你的 Landing Page 已完全配置：
### [必要配置](https://nextdevkit.com/zh/docs/project-landing#%E5%BF%85%E8%A6%81%E9%85%8D%E7%BD%AE)
  * ✅ 环境变量设置完成
  * ✅ 应用名称和元数据更新
  * ✅ Logo 上传（浅色和深色）
  * ✅ 颜色主题自定义
  * ✅ Hero 部分内容更新


### [内容配置](https://nextdevkit.com/zh/docs/project-landing#%E5%86%85%E5%AE%B9%E9%85%8D%E7%BD%AE)
  * ✅ 功能标签页/步骤配置
  * ✅ 推荐添加
  * ✅ FAQ 部分更新
  * ✅ 导航菜单自定义
  * ✅ 页脚配置


### [可选配置](https://nextdevkit.com/zh/docs/project-landing#%E5%8F%AF%E9%80%89%E9%85%8D%E7%BD%AE)
  * 支付提供商设置
  * 定价计划配置
  * 社交媒体链接添加
  * 联系表单配置
  * 博客文章创建
  * 文档编写


## [配置文件参考](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E5%8F%82%E8%80%83)
所有配置文件的快速参考：
配置项 | 文件路径 | 用途  
---|---|---  
**主配置** | `src/config/index.ts` | 核心应用设置、元数据、支付、邮件  
**翻译** | `messages/zh.json` | 所有组件的中文内容  
**英文翻译** | `messages/en.json` | 所有组件的英文内容  
**导航** | `src/config/navigation.ts` | 主导航菜单结构  
**页脚** | `src/config/footer.ts` | 页脚链接和订阅  
**社交媒体** | `src/config/social-media.tsx` | 社交媒体链接  
**Hero 部分** | `src/config/marketing/hero-section.ts` | Hero 按钮链接  
**功能标签** | `src/config/marketing/feature-tabs.ts` | 功能标签配置  
**定价** | `src/config/marketing/pricing.ts` | 定价表详情  
## [下一步](https://nextdevkit.com/zh/docs/project-landing#%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在你的 Landing Page 已配置完成：
  1. **全面测试** - 检查所有页面和交互
  2. **添加内容** - 编写博客文章和文档
  3. **设置数据库** - 为生产环境配置数据库
  4. **配置认证** - 设置 OAuth 提供商
  5. **部署** - 发布到 Vercel、Cloudflare 或 AWS


## [常见配置模式](https://nextdevkit.com/zh/docs/project-landing#%E5%B8%B8%E8%A7%81%E9%85%8D%E7%BD%AE%E6%A8%A1%E5%BC%8F)
### [全站 URL 更改](https://nextdevkit.com/zh/docs/project-landing#%E5%85%A8%E7%AB%99-url-%E6%9B%B4%E6%94%B9)
如果需要全站更改 URL：
  1. 更新 `src/config/navigation.ts` 中的导航链接
  2. 更新 `src/config/footer.ts` 中的页脚链接
  3. 更新 `src/config/marketing/hero-section.ts` 中的 Hero 按钮链接
  4. 更新 `src/config/marketing/feature-tabs.ts` 中的功能链接


### [添加新语言](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E6%96%B0%E8%AF%AD%E8%A8%80)
  1. 创建 `messages/[locale].json`（例如 `messages/fr.json`）
  2. 从 `messages/zh.json` 复制内容并翻译
  3. 在 `src/config/index.ts` 中添加语言：


```
i18n: {
  locales: ["en", "zh", "fr"],    // 添加你的语言
  defaultLocale: "en",
}
```

  1. 使用 `http://localhost:3000/fr` 测试


### [多品牌自定义](https://nextdevkit.com/zh/docs/project-landing#%E5%A4%9A%E5%93%81%E7%89%8C%E8%87%AA%E5%AE%9A%E4%B9%89)
对于白标或多品牌：
  1. 创建品牌特定的配置文件
  2. 使用环境变量进行品牌选择
  3. 根据域名或环境加载相应配置


## [故障排除](https://nextdevkit.com/zh/docs/project-landing#%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [更改未生效？](https://nextdevkit.com/zh/docs/project-landing#%E6%9B%B4%E6%94%B9%E6%9C%AA%E7%94%9F%E6%95%88)
  1. **硬刷新** - 按 `Cmd+Shift+R`（Mac）或 `Ctrl+Shift+R`（Windows）
  2. **清除 Next.js 缓存** - 删除 `.next` 文件夹并重启开发服务器
  3. **检查文件路径** - 确保编辑了正确的文件
  4. **检查语法** - 验证 JSON/TypeScript 语法


### [翻译不工作？](https://nextdevkit.com/zh/docs/project-landing#%E7%BF%BB%E8%AF%91%E4%B8%8D%E5%B7%A5%E4%BD%9C)
  1. **检查语言** - 验证 URL 中的语言正确（`/zh` 或 `/en`）
  2. **检查翻译键** - 确保键在 `messages/[locale].json` 中存在
  3. **重启服务器** - 翻译更改可能需要重启


### [样式未应用？](https://nextdevkit.com/zh/docs/project-landing#%E6%A0%B7%E5%BC%8F%E6%9C%AA%E5%BA%94%E7%94%A8)
  1. **检查 Tailwind 类** - 确保类名有效
  2. **检查主题变量** - 验证 `globals.css` 中的 CSS 变量
  3. **清除缓存** - 删除 `.next` 文件夹


* * *
恭喜！🎉 你已经成功配置了 NEXTDEVKIT Landing Page。你的网站现在已准备好吸引和转化客户！
[NextDevKit 项目架构 全面了解 NextDevKit 的项目结构，从基础的 Next.js 设置到生产级 SaaS 架构的完整指南。](https://nextdevkit.com/zh/docs/project-architecture)[构建 UI 组件 学习如何快速构建 NextDevKit 的 UI 组件，构建你的 SaaS 项目。](https://nextdevkit.com/zh/docs/build-ui-components)
[](https://nextdevkit.com/zh/docs/project-landing#%E5%BF%AB%E9%80%9F%E5%90%AF%E5%8A%A85-%E5%88%86%E9%92%9F%E4%B8%8A%E6%89%8B)[](https://nextdevkit.com/zh/docs/project-landing#%E6%AD%A5%E9%AA%A4-1%E6%9C%80%E5%B0%8F%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/project-landing#%E6%AD%A5%E9%AA%A4-2%E5%90%AF%E5%8A%A8%E5%BC%80%E5%8F%91%E6%9C%8D%E5%8A%A1%E5%99%A8)[](https://nextdevkit.com/zh/docs/project-landing#%E6%B8%90%E8%BF%9B%E5%BC%8F%E9%85%8D%E7%BD%AE%E4%B9%8B%E6%97%85)[](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%B8%80%E5%B1%82%E5%93%81%E7%89%8C%E6%A0%87%E8%AF%86)[](https://nextdevkit.com/zh/docs/project-landing#%E6%9B%B4%E6%96%B0%E5%9F%BA%E7%A1%80%E5%85%83%E6%95%B0%E6%8D%AE)[](https://nextdevkit.com/zh/docs/project-landing#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%A2%9C%E8%89%B2%E4%B8%BB%E9%A2%98)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%9A%97%E9%BB%91%E6%A8%A1%E5%BC%8F)[](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%BA%8C%E5%B1%82hero-%E4%B8%BB%E9%A1%B5%E6%A8%AA%E5%B9%85)[](https://nextdevkit.com/zh/docs/project-landing#%E7%BC%96%E8%BE%91-hero-%E5%86%85%E5%AE%B9)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%8C%89%E9%92%AE%E9%93%BE%E6%8E%A5)[](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%B8%89%E5%B1%82%E5%8A%9F%E8%83%BD%E5%B1%95%E7%A4%BA)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E5%8A%9F%E8%83%BD%E6%A0%87%E7%AD%BE%E9%A1%B5)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E5%8A%9F%E8%83%BD%E6%AD%A5%E9%AA%A4)[](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E5%9B%9B%E5%B1%82%E7%A4%BE%E4%BC%9A%E8%AF%81%E6%98%8E)[](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E5%AE%A2%E6%88%B7%E6%8E%A8%E8%8D%90)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE-faq-%E9%83%A8%E5%88%86)[](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E4%BA%94%E5%B1%82%E5%AE%9A%E4%BB%B7%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/project-landing#%E8%AE%BE%E7%BD%AE%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%94%AF%E4%BB%98%E8%AE%A1%E5%88%92)[](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E8%AE%A1%E5%88%92%E6%8F%8F%E8%BF%B0)[](https://nextdevkit.com/zh/docs/project-landing#%E7%AC%AC%E5%85%AD%E5%B1%82%E5%AF%BC%E8%88%AA%E5%92%8C%E9%A1%B5%E8%84%9A)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E5%AF%BC%E8%88%AA%E8%8F%9C%E5%8D%95)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E9%A1%B5%E8%84%9A)[](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E7%A4%BE%E4%BA%A4%E5%AA%92%E4%BD%93%E9%93%BE%E6%8E%A5)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%A3%80%E6%9F%A5%E6%B8%85%E5%8D%95)[](https://nextdevkit.com/zh/docs/project-landing#%E5%BF%85%E8%A6%81%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/project-landing#%E5%86%85%E5%AE%B9%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/project-landing#%E5%8F%AF%E9%80%89%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/project-landing#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E5%8F%82%E8%80%83)[](https://nextdevkit.com/zh/docs/project-landing#%E4%B8%8B%E4%B8%80%E6%AD%A5)[](https://nextdevkit.com/zh/docs/project-landing#%E5%B8%B8%E8%A7%81%E9%85%8D%E7%BD%AE%E6%A8%A1%E5%BC%8F)[](https://nextdevkit.com/zh/docs/project-landing#%E5%85%A8%E7%AB%99-url-%E6%9B%B4%E6%94%B9)[](https://nextdevkit.com/zh/docs/project-landing#%E6%B7%BB%E5%8A%A0%E6%96%B0%E8%AF%AD%E8%A8%80)[](https://nextdevkit.com/zh/docs/project-landing#%E5%A4%9A%E5%93%81%E7%89%8C%E8%87%AA%E5%AE%9A%E4%B9%89)[](https://nextdevkit.com/zh/docs/project-landing#%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/project-landing#%E6%9B%B4%E6%94%B9%E6%9C%AA%E7%94%9F%E6%95%88)[](https://nextdevkit.com/zh/docs/project-landing#%E7%BF%BB%E8%AF%91%E4%B8%8D%E5%B7%A5%E4%BD%9C)[](https://nextdevkit.com/zh/docs/project-landing#%E6%A0%B7%E5%BC%8F%E6%9C%AA%E5%BA%94%E7%94%A8)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
