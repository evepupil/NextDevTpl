# 来源: https://nextdevkit.com/zh/docs/blog

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
基于文件的博客系统🤔 什么是 MDX？
# 基于文件的博客系统
从基础到高级，全面掌握 NextDevKit 博客模块，学习 MDX 写作、内容管理和高级功能定制。
> NextDevKit 使用 **Fumadocs MDX** 构建博客系统，提供了强大的内容创作和管理能力。
博客是现代网站不可缺少的功能模块。无论是分享技术心得，还是公司发布产品更新，一个功能完善的博客系统都能带来巨大价值，通过 SEO 优化可以带来更多的自然搜索流量。
NextDevKit 内置了基于 MDX 的现代化博客系统，让你专注于内容创作。
## [🤔 什么是 MDX？](https://nextdevkit.com/zh/docs/blog#-%E4%BB%80%E4%B9%88%E6%98%AF-mdx)
### [MDX 核心概念](https://nextdevkit.com/zh/docs/blog#mdx-%E6%A0%B8%E5%BF%83%E6%A6%82%E5%BF%B5)
**MDX (Markdown for JSX)** 是 Markdown 的超集，允许你在 Markdown 文档中直接使用 JSX 组件。这意味着你可以：
  * **保持 Markdown 的简洁性** ：继续使用熟悉的 Markdown 语法
  * **增强交互能力** ：嵌入 React 组件实现复杂功能
  * **统一开发体验** ：内容和组件使用相同的技术栈
  * **类型安全** ：享受 TypeScript 的完整支持


### [MDX vs 传统 Markdown](https://nextdevkit.com/zh/docs/blog#mdx-vs-%E4%BC%A0%E7%BB%9F-markdown)
**传统 Markdown 的局限** ：
```
# 我的博客文章
这是一段普通文本。
![图片](./image.png)
```

**MDX 的强大之处** ：
```
# 我的博客文章
这是一段普通文本。
<Image
  src="/blog/my-image.png"
  alt="高清图片"
  width={800} 
  height={400}
  priority
/>
<VideoEmbed url="https://www.youtube.com/watch?v=..." />
```

## [🏗️ NextDevKit 博客架构](https://nextdevkit.com/zh/docs/blog#%EF%B8%8F-nextdevkit-%E5%8D%9A%E5%AE%A2%E6%9E%B6%E6%9E%84)
### [目录结构](https://nextdevkit.com/zh/docs/blog#%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)
NextDevKit 的博客系统采用基于文件的内容管理方式：
**核心组件说明** ：
  * **`src/content/blog/`**：存放所有博客 MDX 文件
  * **`app/[locale]/(marketing)/blog/`**：博客页面路由和布局
  * **`components/blog/`**：博客专用的 React 组件
  * **多语言支持** ：`.mdx` (英文) 和 `.zh.mdx` (中文) 文件


### [技术栈](https://nextdevkit.com/zh/docs/blog#%E6%8A%80%E6%9C%AF%E6%A0%88)
NextDevKit 博客系统基于以下技术：
  * **Fumadocs MDX** ：MDX 解析和渲染引擎
  * **Next.js 15** ：应用框架和路由系统
  * **TypeScript** ：类型安全的开发体验
  * **Tailwind CSS** ：样式系统
  * **Rehype/Remark** ：内容处理插件


## [✍️ 创建你的第一篇博客](https://nextdevkit.com/zh/docs/blog#%EF%B8%8F-%E5%88%9B%E5%BB%BA%E4%BD%A0%E7%9A%84%E7%AC%AC%E4%B8%80%E7%AF%87%E5%8D%9A%E5%AE%A2)
### [理解 Frontmatter 与 Fumadocs 配置](https://nextdevkit.com/zh/docs/blog#%E7%90%86%E8%A7%A3-frontmatter-%E4%B8%8E-fumadocs-%E9%85%8D%E7%BD%AE)
#### [Frontmatter Schema 定义](https://nextdevkit.com/zh/docs/blog#frontmatter-schema-%E5%AE%9A%E4%B9%89)
NextDevKit 在 `source.config.ts` 中定义了博客的 **Zod Schema** ，确保每篇文章的元数据格式正确：
source.config.ts
```
export const blogs = defineCollections({
  type: "doc",
  dir: "src/content/blog",
  schema: (ctx) => {
    return z.object({
      title: z.string(),                    // 必填：文章标题
      description: z.string(),              // 必填：文章描述
      keywords: z.string().optional(),      // 可选：SEO 关键词
      createdAt: z.date(),                  // 必填：创建日期
      updatedAt: z.date(),                  // 必填：更新日期
      tags: z.array(z.string()).optional(), // 可选：标签数组
      author: z.string(),                   // 必填：作者信息
      image: z.string().optional(),         // 可选：封面图片
      slug: z.string().default(/* 自动生成 */),   // 自动：URL 路径
      locale: z.string().default(/* 自动检测 */), // 自动：语言区域
    });
  },
});
```

#### [智能字段处理](https://nextdevkit.com/zh/docs/blog#%E6%99%BA%E8%83%BD%E5%AD%97%E6%AE%B5%E5%A4%84%E7%90%86)
**自动 Slug 生成** ：
```
slug: z.string().default(ctx.path.split("/").pop()?.split(".")[0])
```

文件 `nextjs-guide.zh.mdx` → slug: `"nextjs-guide"`
**自动语言检测** ：
```
locale: z.string().default(() => {
  const locale = ctx.path.split("/").pop()?.split(".")[1];
  if (locale === "md" || locale === "mdx") {
    return appConfig.i18n.defaultLocale; // 默认 "en"
  }
  return locale; // "zh", "ja" 等
})
```

#### [完整 Frontmatter 示例](https://nextdevkit.com/zh/docs/blog#%E5%AE%8C%E6%95%B4-frontmatter-%E7%A4%BA%E4%BE%8B)
每篇博客都以 YAML Frontmatter 开始，定义文章的元数据：
src/content/blog/my-first-post.zh.mdx
```
---
title: 我的第一篇博客
description: "这是我使用 NextDevKit 创建的第一篇博客文章，介绍了基础的 MDX 写作方法。"
keywords: "nextjs 博客, mdx 教程, nextdevkit"
createdAt: 2025-01-15T10:00:00+08:00
updatedAt: 2025-01-15T10:00:00+08:00
tags: ["nextjs", "博客", "教程"]
author: "你的名字"
image: "/blog/my-first-post.png"
# slug 和 locale 会自动生成，无需手动填写
---
# 欢迎来到我的博客！
```

### [多语言支持](https://nextdevkit.com/zh/docs/blog#%E5%A4%9A%E8%AF%AD%E8%A8%80%E6%94%AF%E6%8C%81)
NextDevKit 支持多语言博客。为同一篇文章创建不同语言版本：
```
src/content/blog/
├── my-post.mdx        # 英文版本
└── my-post.zh.mdx     # 中文版本
```

当然你也可以添加更多的语言版本。
## [📊 博客管理和优化](https://nextdevkit.com/zh/docs/blog#-%E5%8D%9A%E5%AE%A2%E7%AE%A1%E7%90%86%E5%92%8C%E4%BC%98%E5%8C%96)
### [文章组织策略](https://nextdevkit.com/zh/docs/blog#%E6%96%87%E7%AB%A0%E7%BB%84%E7%BB%87%E7%AD%96%E7%95%A5)
**按时间组织** ：
```
src/content/blog/
├── 2025-01-nextjs-tutorial.mdx
├── 2025-02-react-patterns.mdx
└── 2025-03-typescript-tips.mdx
```

**按主题组织** ：
```
src/content/blog/
├── nextjs-complete-guide.mdx
├── react-best-practices.mdx
└── typescript-advanced.mdx
```

### [标签和分类系统](https://nextdevkit.com/zh/docs/blog#%E6%A0%87%E7%AD%BE%E5%92%8C%E5%88%86%E7%B1%BB%E7%B3%BB%E7%BB%9F)
使用标签对文章进行分类：
```
tags: ["nextjs", "react", "typescript", "教程"]
```

**标签命名建议** ：
  * **技术标签** ：nextjs, react, typescript, css
  * **类型标签** ：教程, 指南, 案例研究, 新闻
  * **难度标签** ：初学者, 中级, 高级
  * **主题标签** ：前端, 后端, 全栈, 设计
  * **业务标签** ：AI, 云计算, 数据库, 安全, 运维


### [SEO 优化](https://nextdevkit.com/zh/docs/blog#seo-%E4%BC%98%E5%8C%96)
**标题优化** ：
```
title: "Next.js 15 完全指南：从入门到实战 (2025)"
```

**描述优化** ：
```
description: "深入学习 Next.js 15 的新特性，包括 App Router、Server Components、并行路由等。本指南提供实战案例和最佳实践。"
```

**关键词策略** ：
```
keywords: "nextjs 15, app router, server components, react, nextjs 教程"
```

### [图片优化策略](https://nextdevkit.com/zh/docs/blog#%E5%9B%BE%E7%89%87%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5)
**图片命名规范** ：
```
public/blog/
├── nextjs-guide/
│   ├── hero-image.png
│   ├── app-router-diagram.svg
│   └── performance-chart.webp
└── react-patterns/
    ├── component-tree.png
    └── state-flow.svg
```

## [🔍 内容管理最佳实践](https://nextdevkit.com/zh/docs/blog#-%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)
NextDevKit 的博客系统是基于文件的，你可以在 IDE 中直接编辑 MDX 文件，也可以使用 AI 辅助生成内容。
### [CMS vs 文件管理](https://nextdevkit.com/zh/docs/blog#cms-vs-%E6%96%87%E4%BB%B6%E7%AE%A1%E7%90%86)
**文件管理的优势** （NextDevKit 采用）：
  * **版本控制** ：Git 管理内容变更历史
  * **开发体验** ：在 IDE 中直接编辑，可以 AI 辅助生成内容
  * **类型安全** ：TypeScript 检查内容结构
  * **离线工作** ：无需网络连接即可创作
  * **自动部署** ：Git 提交触发网站更新


**CMS 的使用场景** ：
  * **多人协作** ：非技术团队成员参与内容创作
  * **客户需求** ：客户需要独立管理内容
  * **工作流程** ：需要内容审核和发布流程


## [📚 总结](https://nextdevkit.com/zh/docs/blog#-%E6%80%BB%E7%BB%93)
NextDevKit 的博客系统为内容创作提供了强大而灵活的解决方案：
### [💡 核心优势](https://nextdevkit.com/zh/docs/blog#-%E6%A0%B8%E5%BF%83%E4%BC%98%E5%8A%BF)
**🚀 现代化创作体验** ：
  * MDX 融合 Markdown 简洁性和 React 灵活性
  * 实时预览和热重载
  * TypeScript 类型安全
  * 丰富的内置组件


**📊 内容管理能力** ：
  * 基于文件的版本控制
  * 多语言内容支持
  * 标签分类系统
  * SEO 优化内置


**🎨 定制化能力** ：
  * 自定义 MDX 组件
  * 灵活的样式系统
  * 可扩展的功能架构
  * 性能优化内置


通过掌握 NextDevKit 博客系统，你可以构建专业、高效、用户友好的内容平台，专注于创作高质量的内容！
**参考资源** ：
  * [NextDevKit 博客示例](https://nextdevkit.com/blog)


[对象存储与文件管理 深入学习如何在 NextDevKit 中使用对象存储，掌握预签名 URL、Image Proxy 和文件上传的完整功能。](https://nextdevkit.com/zh/docs/storage)[如何组织和创建文档 学习如何在 NEXTDEVKIT 中使用 Fumadocs 创建和管理文档](https://nextdevkit.com/zh/docs/documentation)
[](https://nextdevkit.com/zh/docs/blog#-%E4%BB%80%E4%B9%88%E6%98%AF-mdx)[](https://nextdevkit.com/zh/docs/blog#mdx-%E6%A0%B8%E5%BF%83%E6%A6%82%E5%BF%B5)[](https://nextdevkit.com/zh/docs/blog#mdx-vs-%E4%BC%A0%E7%BB%9F-markdown)[](https://nextdevkit.com/zh/docs/blog#%EF%B8%8F-nextdevkit-%E5%8D%9A%E5%AE%A2%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/blog#%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)[](https://nextdevkit.com/zh/docs/blog#%E6%8A%80%E6%9C%AF%E6%A0%88)[](https://nextdevkit.com/zh/docs/blog#%EF%B8%8F-%E5%88%9B%E5%BB%BA%E4%BD%A0%E7%9A%84%E7%AC%AC%E4%B8%80%E7%AF%87%E5%8D%9A%E5%AE%A2)[](https://nextdevkit.com/zh/docs/blog#%E7%90%86%E8%A7%A3-frontmatter-%E4%B8%8E-fumadocs-%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/blog#frontmatter-schema-%E5%AE%9A%E4%B9%89)[](https://nextdevkit.com/zh/docs/blog#%E6%99%BA%E8%83%BD%E5%AD%97%E6%AE%B5%E5%A4%84%E7%90%86)[](https://nextdevkit.com/zh/docs/blog#%E5%AE%8C%E6%95%B4-frontmatter-%E7%A4%BA%E4%BE%8B)[](https://nextdevkit.com/zh/docs/blog#%E5%A4%9A%E8%AF%AD%E8%A8%80%E6%94%AF%E6%8C%81)[](https://nextdevkit.com/zh/docs/blog#-%E5%8D%9A%E5%AE%A2%E7%AE%A1%E7%90%86%E5%92%8C%E4%BC%98%E5%8C%96)[](https://nextdevkit.com/zh/docs/blog#%E6%96%87%E7%AB%A0%E7%BB%84%E7%BB%87%E7%AD%96%E7%95%A5)[](https://nextdevkit.com/zh/docs/blog#%E6%A0%87%E7%AD%BE%E5%92%8C%E5%88%86%E7%B1%BB%E7%B3%BB%E7%BB%9F)[](https://nextdevkit.com/zh/docs/blog#seo-%E4%BC%98%E5%8C%96)[](https://nextdevkit.com/zh/docs/blog#%E5%9B%BE%E7%89%87%E4%BC%98%E5%8C%96%E7%AD%96%E7%95%A5)[](https://nextdevkit.com/zh/docs/blog#-%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5)[](https://nextdevkit.com/zh/docs/blog#cms-vs-%E6%96%87%E4%BB%B6%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/blog#-%E6%80%BB%E7%BB%93)[](https://nextdevkit.com/zh/docs/blog#-%E6%A0%B8%E5%BF%83%E4%BC%98%E5%8A%BF)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
