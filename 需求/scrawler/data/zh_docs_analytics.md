# 来源: https://nextdevkit.com/zh/docs/analytics

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
分析统计🏗️ 分析系统架构
# 分析统计
学习如何在 NEXTDEVKIT 中通过 Cookie 同意实现分析跟踪
## [🏗️ 分析系统架构](https://nextdevkit.com/zh/docs/analytics#%EF%B8%8F-%E5%88%86%E6%9E%90%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)
NEXTDEVKIT 的分析系统结构如下：
```
src/
├── config/
│   └── analytics.ts              # 分析提供商配置
├── components/
│   └── shared/
│       └── cookie/
│           ├── cookie-consent.tsx           # Cookie 同意组件
│           └── cookie-consent-config.ts     # 同意配置
├── app/
│   └── [locale]/
│       └── layout.tsx             # 布局中的分析集成
└── lib/
    └── metadata.ts                # SEO 元数据集成
```

## [⚙️ 分析配置](https://nextdevkit.com/zh/docs/analytics#%EF%B8%8F-%E5%88%86%E6%9E%90%E9%85%8D%E7%BD%AE)
### [分析提供商](https://nextdevkit.com/zh/docs/analytics#%E5%88%86%E6%9E%90%E6%8F%90%E4%BE%9B%E5%95%86)
分析提供商在 `src/config/analytics.ts` 中配置：
src/config/analytics.ts
```
const analyticsConfig: AnalyticsConfig = {
	google: {
		enabled: !!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
		label: "Google Analytics",
		config: {
			trackingId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
		},
		onAccept: () => {
			// Google Analytics 初始化代码
		},
	},
	umami: {
		enabled: !!process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
		label: "Umami Analytics",
		config: {
			url: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
			websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
		},
		onAccept: () => {
			// Umami Analytics 初始化代码
		},
	},
	plausible: {
		enabled: !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
		label: "Plausible Analytics",
		config: {
			domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
			src: process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL,
		},
		onAccept: () => {
			// Plausible Analytics 初始化代码
		},
	},
};
```

### [环境变量](https://nextdevkit.com/zh/docs/analytics#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)
为您的分析提供商设置所需的环境变量：
.env
```
# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
# Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://analytics.umami.is/script.js
# Plausible Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
```

## [📈 分析提供商设置](https://nextdevkit.com/zh/docs/analytics#-%E5%88%86%E6%9E%90%E6%8F%90%E4%BE%9B%E5%95%86%E8%AE%BE%E7%BD%AE)
### [Google Analytics 设置](https://nextdevkit.com/zh/docs/analytics#google-analytics-%E8%AE%BE%E7%BD%AE)
  1. **创建 Google Analytics 账户** ：
     * 访问 
     * 创建新属性
     * 获取您的测量 ID（以 "G-" 开头）
  2. **环境变量** ：
```
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```



### [Umami Analytics 设置](https://nextdevkit.com/zh/docs/analytics#umami-analytics-%E8%AE%BE%E7%BD%AE)
  1. **创建 Umami 账户** ：
     * 访问 
     * 创建新网站
     * 获取您的网站 ID 和脚本 URL
  2. **环境变量** ：
```
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-website-id
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
```



### [Plausible Analytics 设置](https://nextdevkit.com/zh/docs/analytics#plausible-analytics-%E8%AE%BE%E7%BD%AE)
  1. **创建 Plausible 账户** ：
     * 访问 
     * 添加您的网站
     * 获取您的域名和脚本 URL
  2. **环境变量** ：
```
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
```



## [🍪 Cookie 同意系统](https://nextdevkit.com/zh/docs/analytics#-cookie-%E5%90%8C%E6%84%8F%E7%B3%BB%E7%BB%9F)
### [Cookie 同意组件](https://nextdevkit.com/zh/docs/analytics#cookie-%E5%90%8C%E6%84%8F%E7%BB%84%E4%BB%B6)
NEXTDEVKIT 与 `vanilla-cookieconsent` 集成，提供符合 GDPR 的 Cookie 管理：
src/components/shared/cookie/cookie-consent.tsx
```
'use client';
import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';
import 'vanilla-cookieconsent/dist/cookieconsent.css';
import getConfig from './cookie-consent-config';
const CookieConsentComponent = () => {
  useEffect(() => {
    const initCookieConsent = async () => {
      await CookieConsent.run(getConfig());
    };
    initCookieConsent().catch(console.error);
  }, []);
  return <></>;
};
export default CookieConsentComponent;
```

### [Cookie 同意配置](https://nextdevkit.com/zh/docs/analytics#cookie-%E5%90%8C%E6%84%8F%E9%85%8D%E7%BD%AE)
同意配置自动与您的分析提供商集成：
src/components/shared/cookie/cookie-consent-config.ts
```
import { getEnabledAnalytics, hasEnabledAnalytics } from "@/config/analytics";
const getConfig = () => {
  const enabledAnalytics = getEnabledAnalytics();
  const hasAnalytics = hasEnabledAnalytics();
  // 根据启用的分析动态构建服务对象
  const analyticsServices: Record<string, any> = {};
  Object.entries(enabledAnalytics).forEach(([key, provider]) => {
    analyticsServices[key] = {
      label: provider.label,
      onAccept: provider.onAccept,
    };
  });
  return {
    categories: {
      necessary: {
        enabled: true,
        readOnly: true,
      },
      ...(hasAnalytics && {
        analytics: {
          autoClear: {
            cookies: [
              { name: /^_ga/ },      // Google Analytics
              { name: "_gid" },      // Google Analytics
              { name: "__plausible" }, // Plausible
            ],
          },
          services: analyticsServices,
        },
      }),
    },
    // ... 其余配置
  };
};
```

### [布局集成](https://nextdevkit.com/zh/docs/analytics#%E5%B8%83%E5%B1%80%E9%9B%86%E6%88%90)
分析集成到主布局中：
src/components/shared/providers.tsx
```
export async function AppProviders({
	children,
	locale,
}: PropsWithChildren<{ locale: string }>) {
	const defaultMode = appConfig.ui.theme.defaultMode;
	return (
		<html lang={locale} suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased min-w-screen overflow-x-hidden`}
			>
				// 其他提供商
				{children}
			</body>
			<CookieConsentComponent />
		</html>
	);
}
```

## [🔧 故障排除](https://nextdevkit.com/zh/docs/analytics#-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)
### [常见问题](https://nextdevkit.com/zh/docs/analytics#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
**分析未加载** ：
  * 检查环境变量是否正确设置
  * 验证 Cookie 同意已被接受
  * 检查浏览器控制台中的 JavaScript 错误
  * 确保分析脚本未被广告拦截器阻止


**Cookie 同意未显示** ：
  * 验证 `hasEnabledAnalytics()` 返回 true
  * 检查是否已给予同意
  * 确保 Cookie 同意组件已正确导入


**事件未跟踪** ：
  * 验证分析提供商已正确初始化
  * 检查是否已给予分析 Cookie 同意
  * 确保事件跟踪函数被正确调用


## [🔗 相关资源](https://nextdevkit.com/zh/docs/analytics#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
* * *
## [🎯 下一步](https://nextdevkit.com/zh/docs/analytics#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在您了解了分析系统，请探索这些相关功能：
  * 🎨 [主题](https://nextdevkit.com/docs/themes)
  * 🔍 [SEO](https://nextdevkit.com/docs/seo)
  * 📚 [文档](https://nextdevkit.com/docs/documentation)


[AI 集成 学习如何在 NEXTDEVKIT 中集成和使用 Vercel AI SDK，构建强大的 AI 功能](https://nextdevkit.com/zh/docs/ai-integration)[环境变量参考 全面了解、配置和管理 NEXTDEVKIT 在不同部署平台上的所有环境变量的完整指南。](https://nextdevkit.com/zh/docs/environment-variables)
[](https://nextdevkit.com/zh/docs/analytics#%EF%B8%8F-%E5%88%86%E6%9E%90%E7%B3%BB%E7%BB%9F%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/analytics#%EF%B8%8F-%E5%88%86%E6%9E%90%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/analytics#%E5%88%86%E6%9E%90%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/analytics#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)[](https://nextdevkit.com/zh/docs/analytics#-%E5%88%86%E6%9E%90%E6%8F%90%E4%BE%9B%E5%95%86%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/analytics#google-analytics-%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/analytics#umami-analytics-%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/analytics#plausible-analytics-%E8%AE%BE%E7%BD%AE)[](https://nextdevkit.com/zh/docs/analytics#-cookie-%E5%90%8C%E6%84%8F%E7%B3%BB%E7%BB%9F)[](https://nextdevkit.com/zh/docs/analytics#cookie-%E5%90%8C%E6%84%8F%E7%BB%84%E4%BB%B6)[](https://nextdevkit.com/zh/docs/analytics#cookie-%E5%90%8C%E6%84%8F%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/analytics#%E5%B8%83%E5%B1%80%E9%9B%86%E6%88%90)[](https://nextdevkit.com/zh/docs/analytics#-%E6%95%85%E9%9A%9C%E6%8E%92%E9%99%A4)[](https://nextdevkit.com/zh/docs/analytics#%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)[](https://nextdevkit.com/zh/docs/analytics#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)[](https://nextdevkit.com/zh/docs/analytics#-%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
