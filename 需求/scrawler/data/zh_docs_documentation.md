# 来源: https://nextdevkit.com/zh/docs/documentation

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
如何组织和创建文档⚙️ 文档配置
# 如何组织和创建文档
学习如何在 NEXTDEVKIT 中使用 Fumadocs 创建和管理文档
## [⚙️ 文档配置](https://nextdevkit.com/zh/docs/documentation#%EF%B8%8F-%E6%96%87%E6%A1%A3%E9%85%8D%E7%BD%AE)
### [源配置](https://nextdevkit.com/zh/docs/documentation#%E6%BA%90%E9%85%8D%E7%BD%AE)
文档系统在 `source.config.ts` 中配置：
src/source.config.ts
```
import { defineDocs } from "fumadocs-mdx/config";
export const docs = defineDocs({
  dir: "src/content/docs",
});
```

### [源加载器](https://nextdevkit.com/zh/docs/documentation#%E6%BA%90%E5%8A%A0%E8%BD%BD%E5%99%A8)
文档使用 Fumadocs 在 `src/lib/source.ts` 中加载：
src/lib/source.ts
```
export const source = loader({
  i18n,
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
```

## [📝 创建文档](https://nextdevkit.com/zh/docs/documentation#-%E5%88%9B%E5%BB%BA%E6%96%87%E6%A1%A3)
### [添加新的文档页面](https://nextdevkit.com/zh/docs/documentation#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E6%96%87%E6%A1%A3%E9%A1%B5%E9%9D%A2)
在 `src/content/docs/` 中创建一个新的 MDX 文件：
```
---
title: API 参考
description: NEXTDEVKIT 的完整 API 参考
icon: Code
---
# API 参考
NEXTDEVKIT 服务器操作和工具的完整 API 参考。
## 认证 API
### `getSession()`
在服务器端获取当前用户会话。
```typescript title="src/app/components/server-component.tsx"
import { getSession } from '@/lib/auth/server';
export default async function ServerComponent() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/auth/login');
  }
  return <div>欢迎，{session.user.name}！</div>;
}
```

frontmatter 中的 `icon` 属性支持所有 Lucide 图标，并将在侧边栏中生成为图标。
## [组织结构](https://nextdevkit.com/zh/docs/documentation#%E7%BB%84%E7%BB%87%E7%BB%93%E6%9E%84)
Fumadocs 支持文档的分层组织。
您可以在每个文件夹中创建 `meta.json` 文件来组织文档。
例如，要创建一个名为 `configuration` 的新章节，您需要在 `src/content/docs/` 目录中创建一个名为 `configuration` 的新文件夹，并在其中添加一个 `meta.json` 文件。
src/content/docs/configuration/meta.json
```
{
  "title": "配置",
  "description": "配置文档",
  "pages": [
    "index",
    "website-config",
    "marketing-config"
  ]
}
```

## [多语言支持](https://nextdevkit.com/zh/docs/documentation#%E5%A4%9A%E8%AF%AD%E8%A8%80%E6%94%AF%E6%8C%81)
Fumadocs 支持多语言文档。
您可以使用以下文件命名约定创建多语言内容：
  * 默认语言（例如英语）：filename.mdx
  * 其他语言（例如中文）：filename.zh.mdx


对于国际化，您可以在同一文件夹中创建一个新的 `meta.zh.json` 文件。
## [搜索 API](https://nextdevkit.com/zh/docs/documentation#%E6%90%9C%E7%B4%A2-api)
Fumadocs 提供搜索 API 来搜索文档。
您可以使用 `createI18nSearchAPI` 函数来搜索文档。
src/app/api/search/route.ts
```
export const { GET } = createI18nSearchAPI("advanced", {
	i18n: {
		defaultLanguage: appConfig.i18n.defaultLocale,
		languages: Object.keys(appConfig.i18n.locales).filter(
			(locale) => locale !== "zh",
		),
	},
	indexes: source.getLanguages().flatMap((entry) =>
		entry.pages.map((page) => ({
			title: page.data.title,
			description: page.data.description,
			structuredData: (page.data as any)?.structuredData,
			id: page.url,
			url: page.url,
			locale: entry.language,
		})),
	),
});
```

因为默认搜索 API 不支持中文 `zh`，您需要从 `languages` 数组中过滤掉中文。
如果您想支持像中文这样的特殊语言搜索，您可以参考以下链接：
例如，对于中文和日文，它们需要额外的配置：
```
pnpm add @orama/tokenizers
```

更新搜索 API 以支持特殊语言：
src/app/api/search/route.ts
```
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';
import { createTokenizer } from '@orama/tokenizers/mandarin';
export const { GET } = createFromSource(source, {
  localeMap: {
    // [locale]: Orama 选项
    zh: {
      components: {
        tokenizer: createTokenizer(),
      },
      search: {
        threshold: 0,
        tolerance: 0,
      },
    },
  },
});
```

## [🔗 相关资源](https://nextdevkit.com/zh/docs/documentation#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
[基于文件的博客系统 从基础到高级，全面掌握 NextDevKit 博客模块，学习 MDX 写作、内容管理和高级功能定制。](https://nextdevkit.com/zh/docs/blog)[国际化多语言支持 学习如何在 NEXTDEVKIT 中使用 next-intl 实现多语言支持](https://nextdevkit.com/zh/docs/i18n)
[](https://nextdevkit.com/zh/docs/documentation#%EF%B8%8F-%E6%96%87%E6%A1%A3%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/documentation#%E6%BA%90%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/documentation#%E6%BA%90%E5%8A%A0%E8%BD%BD%E5%99%A8)[](https://nextdevkit.com/zh/docs/documentation#-%E5%88%9B%E5%BB%BA%E6%96%87%E6%A1%A3)[](https://nextdevkit.com/zh/docs/documentation#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E6%96%87%E6%A1%A3%E9%A1%B5%E9%9D%A2)[](https://nextdevkit.com/zh/docs/documentation#%E7%BB%84%E7%BB%87%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/documentation#%E5%A4%9A%E8%AF%AD%E8%A8%80%E6%94%AF%E6%8C%81)[](https://nextdevkit.com/zh/docs/documentation#%E6%90%9C%E7%B4%A2-api)[](https://nextdevkit.com/zh/docs/documentation#-%E7%9B%B8%E5%85%B3%E8%B5%84%E6%BA%90)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
