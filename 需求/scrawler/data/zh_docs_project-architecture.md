# 来源: https://nextdevkit.com/zh/docs/project-architecture

---

[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
[![Logo](https://nextdevkit.com/logo-light.svg)文档](https://nextdevkit.com/docs)
`⌘``K`
[](https://nextdevkit.com/)[](https://nextdevkit.com/tutorials)[](https://nextdevkit.com/zh/docs)[](https://nextdevkit.com/zh/docs/tech-stack)[](https://nextdevkit.com/zh/docs/pre)[](https://nextdevkit.com/zh/docs/ai-agents)[](https://nextdevkit.com/zh/docs/project-architecture)
启动项目
[](https://nextdevkit.com/zh/docs/project-landing)[](https://nextdevkit.com/zh/docs/build-ui-components)[](https://nextdevkit.com/zh/docs/email)[](https://nextdevkit.com/zh/docs/storage)[](https://nextdevkit.com/zh/docs/blog)[](https://nextdevkit.com/zh/docs/documentation)[](https://nextdevkit.com/zh/docs/i18n)[](https://nextdevkit.com/zh/docs/ai-integration)[](https://nextdevkit.com/zh/docs/analytics)[](https://nextdevkit.com/zh/docs/environment-variables)
简体中文
NextDevKit 项目架构理解演进过程
# NextDevKit 项目架构
全面了解 NextDevKit 的项目结构，从基础的 Next.js 设置到生产级 SaaS 架构的完整指南。
本指南将通过展示从基础 Next.js 项目到完整生产级 NextdevKit SaaS 模板的演进过程，帮助你理解 NextDevKit 的组织方式。每一步都建立在前一步的基础上，让你轻松理解每个架构决策背后的原理。
## [理解演进过程](https://nextdevkit.com/zh/docs/project-architecture#%E7%90%86%E8%A7%A3%E6%BC%94%E8%BF%9B%E8%BF%87%E7%A8%8B)
NextDevKit 被设计为生产级别的启动模板，这意味着它从一开始就包含了许多功能。然而，了解这个结构是如何演进的可以帮助你：
让我们从头开始，逐步构建到完整的架构。
## [步骤 1：基础 - Next.js 基础](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-1%E5%9F%BA%E7%A1%80---nextjs-%E5%9F%BA%E7%A1%80)
每个 Next.js 项目都从这些基本文件开始。这是运行 Next.js 应用程序所需的最小设置。
**核心文件：**
  * **`layout.tsx`**- 包裹所有页面的根布局（全局页眉、页脚、元数据）
  * **`page.tsx`**- 位于`/` 的首页
  * **`globals.css`**- 全局样式和 Tailwind 指令
  * **`next.config.ts`**- Next.js 配置
  * **`tsconfig.json`**- TypeScript 配置


## [步骤 2：添加基础工具](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-2%E6%B7%BB%E5%8A%A0%E5%9F%BA%E7%A1%80%E5%B7%A5%E5%85%B7)
在构建功能之前，我们添加开发工具和样式基础，以确保代码质量和一致性。
我们可以执行以下命令来添加更多需要的 shadcnui 基础组件：
```
pnpm dlx shadcn@latest add button input card
```

**新增内容：**
  * **`components/ui/`**- shadcn/ui 组件（设计系统基础组件）
  * **`lib/utils.ts`**- 工具函数（cn 辅助函数、格式化器等）
  * **`biome.json`**- 代码格式化和 lint 配置
  * **`components.json`**- shadcn/ui 配置
  * **`postcss.config.mjs`**- Tailwind 的 PostCSS 配置


## [步骤 3：使用 App Router 组织路由](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-3%E4%BD%BF%E7%94%A8-app-router-%E7%BB%84%E7%BB%87%E8%B7%AF%E7%94%B1)
随着应用程序的增长，我们使用 Next.js App Router 模式来组织路由：路由组和国际化。
**架构模式：**
  * **`[locale]/`**- 国际化的动态路由段（例如`/en` 、`/zh`）
  * **`(marketing)/`**- 公共页面的路由组（不影响 URL）
  * **`(app)/`**- 需要认证页面的路由组
  * **`[[...slug]]`**- 可选的 catch-all 路由，用于灵活路由（文档）
  * **`[...slug]`**- 必需的 catch-all 路由，用于博客文章和法律页面


**URL 示例：**
  * `/en/pricing` → 英文定价页面
  * `/zh/blog/nextdevkit-tech-stack` → 中文博客文章
  * `/en/docs/getting-started/overview` → 文档页面
  * `/en/credits` → 积分定价页面
  * `/auth/login` → 登录页面（不需要 locale）
  * `/app/dashboard` → 仪表板（受保护的路由）
  * `/app/admin/users` → 管理员用户页面
  * `/app/ai/chat` → AI 聊天功能


## [步骤 4：组件架构](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-4%E7%BB%84%E4%BB%B6%E6%9E%B6%E6%9E%84)
除了页面的路由之外，我们还需要组织前端组件样式的文件，以便我们可以更好的复用这些前端组件，所有的前端复用组件都放在 `src/components/` 目录下。
**前端复用组件文件组织结构：**
  * **`ui/`**- 来自 shadcn/ui 的原始可复用 UI 组件（更多 shadcn/ui 组件...）
  * **`auth/`**- 认证表单和组件
  * **`marketing/`**- 按功能组织的落地页和营销组件
  * **`dashboard/`**- 应用仪表板布局组件示例
  * **`settings/`**- 按类别组织的用户设置表单（账户、账单、通知、安全、使用情况）
  * **`admin/`**- 管理面板组件
  * **`ai-elements/`**- Vercel AI SDK 相关的 UI 组件（对话、消息、代码块等）
  * **`shared/`**- 跨多个功能共享（页眉、页脚、cookie 等）
  * **`docs/` & `blog/`** - MDX 内容组件
  * **`examples/`**- 示例实现（AI 聊天、AI 图像生成、仪表板示例）
  * **`icons/`**- Logo、社交媒体和技术栈图标


## [步骤 5 内容管理](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-5-%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86)
使用基于 MDX 的内容管理使 APP 易于自定义和维护。用 MDX 来构建博客和文档，并且支持国际化。所有的内容都放在 `src/content/` 目录下。
**配置结构：**
  * **`content/`**- 博客（8 篇文章）、文档和法律页面的 MDX 内容
  * **`i18n/`**- 国际化工具
  * **`messages/`**- 翻译文件（英文和中文）


## [步骤 6：数据库和认证](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-6%E6%95%B0%E6%8D%AE%E5%BA%93%E5%92%8C%E8%AE%A4%E8%AF%81)
数据层和认证系统构成了应用程序的支柱。你需要熟悉 Drizzle ORM 和 Better Auth 的用法来构建你的数据库和认证系统。
数据库 client 和对应的表都放在 `src/database/` 目录下。认证相关的文件都放在 `src/lib/auth/` 目录下。
**数据库层：**
  * **`database/client.ts`**- Drizzle ORM 客户端实例
  * **`database/schema.ts`**- 数据库表和关系（用户、会话、积分、交易等）
  * **`drizzle/`**- 迁移文件和历史记录


**认证系统：**
  * **`lib/auth.ts`**- Better Auth 配置
  * **`lib/auth/client.ts`**- 客户端认证工具（`useSession` 、`reloadSession`）
  * **`lib/auth/server.ts`**- 服务器端认证工具（`getSession` ）
  * **`lib/auth/api.ts`**- API 路由辅助函数
  * **`lib/auth/edge.ts`**- Edge 运行时认证函数
  * **`lib/auth/session-context.ts`**- Session 的 React context
  * **`lib/auth/errors.ts`**- 认证错误处理


**支持库：**
  * **`lib/actions/`**- 用于数据变更的服务器操作
  * **`lib/hooks/`**- 自定义 React hooks
  * **`lib/stores/`**- 全局状态的 Zustand stores
  * **`lib/safe-action.ts`**- 类型安全的服务器操作包装器
  * **`lib/source.ts`**- Fumadocs 源配置
  * **`types/`**- 共享的 TypeScript 类型定义


## [步骤 7：API 路由和服务器函数](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-7api-%E8%B7%AF%E7%94%B1%E5%92%8C%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%87%BD%E6%95%B0)
后端功能通过 API 路由和服务器操作实现。你需要熟悉 Next.js 的 API 路由，你可以创建新的 `/api/**/route.ts` 来实现你的 API 路由。
**API 路由：**
  * **`api/auth/[...all]/route.ts`**- Better Auth API 处理器（catch-all 路由）
  * **`api/ai/demo/chat/route.ts`**- AI 聊天演示端点
  * **`api/ai/demo/image/route.ts`**- AI 图像生成演示端点
  * **`api/search/route.ts`**- 文档搜索功能
  * **`api/jobs/credits/expire/route.ts`**- 定时任务，过期积分
  * **`api/jobs/credits/grant/route.ts`**- 定时任务，授予订阅积分
  * **`api/webhooks/stripe/route.ts`**- Stripe webhook 处理器
  * **`api/webhooks/creem/route.ts`**- Creem webhook 处理器


**特殊路由：**
  * **`image-proxy/[...path]/route.ts`**- 图片代理以优化
  * **`robots.ts`**- 动态生成 robots.txt
  * **`sitemap.ts`**- 动态生成 sitemap


**中间件：**
  * **`middleware.ts`**- 路由保护、重定向、国际化


## [步骤 8：业务逻辑模块](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-8%E4%B8%9A%E5%8A%A1%E9%80%BB%E8%BE%91%E6%A8%A1%E5%9D%97)
企业功能如 AI、积分、支付、邮件和存储被组织为模块化系统。你需要熟悉这些模块的用法来构建你的业务逻辑。
  * **`ai/`**- AI 相关的文件都放在`src/ai/` 目录下。
  * **`credits/`**- 积分相关的文件都放在`src/credits/` 目录下。
  * **`payment/`**- 支付相关的文件都放在`src/payment/` 目录下。
  * **`mail/`**- 邮件相关的文件都放在`src/mail/` 目录下。
  * **`storage/`**- 存储相关的文件都放在`src/storage/` 目录下。


**AI 系统：**
  * **`ai/models/`**- AI 模型配置（聊天、图像）
  * **`ai/agents/`**- AI 代理和工具（天气代理）
  * **`ai/image/`**- 图像生成工具和 hooks
  * **`ai/prompts.ts`**- 系统提示词和模板
  * **`ai/errors.ts`**- AI 特定的错误处理


**积分系统：**
  * **`credits/actions/`**- 积分管理的服务器操作（10+ 个操作文件）
    * 消费、授予、过期积分
    * 跟踪用户交易
    * 处理订阅和购买奖励
  * **`credits/types.ts`**- 积分相关的 TypeScript 类型


**支付系统：**
  * **`payment/actions/`**- 支付操作的服务器操作（10 个操作文件）
    * 创建结账链接和客户门户
    * 处理订阅和一次性付款
    * 处理来自支付提供商的 webhooks
  * **`payment/providers/`**- 支付提供商实现（Stripe、Creem）
  * **`payment/types.ts`**- 支付相关的 TypeScript 类型


**邮件系统：**
  * **`mail/providers/resend.ts`**- Resend 邮件服务集成
  * **`mail/templates/`**- React Email 模板
  * **`mail/components/`**- 可复用的邮件组件（按钮、布局）
  * **`mail/actions.ts`**- 订阅新闻通讯、发送邮件


**存储系统：**
  * **`storage/providers/s3.ts`**- AWS S3 存储集成
  * **`storage/actions.ts`**- 文件上传、签名 URL


**提供商模式的优势：**
  * 通过实现相同的接口轻松添加新提供商
  * 使用模拟提供商进行测试
  * 同时支持多个支付提供商（Stripe + Creem）
  * 不同服务间的一致 API


## [步骤 9：完整的生产架构](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-9%E5%AE%8C%E6%95%B4%E7%9A%84%E7%94%9F%E4%BA%A7%E6%9E%B6%E6%9E%84)
最终架构包括所有部分协同工作，形成生产就绪的 SaaS 应用程序。
## [架构原则](https://nextdevkit.com/zh/docs/project-architecture#%E6%9E%B6%E6%9E%84%E5%8E%9F%E5%88%99)
NextDevKit 遵循这些核心原则来保持质量和可扩展性：
### [1. 关注点分离](https://nextdevkit.com/zh/docs/project-architecture#1-%E5%85%B3%E6%B3%A8%E7%82%B9%E5%88%86%E7%A6%BB)
**展示层** （`components/`）：
  * 渲染界面的 UI 组件
  * 没有直接的数据库或业务逻辑
  * 使用 hooks 和 actions 获取数据


**业务逻辑层** （`ai/`、`credits/`、`payment/`、`mail/`）：
  * 用于数据变更的服务器操作
  * 业务规则和验证
  * 与外部服务集成


**数据层** （`database/`）：
  * 数据库模式定义
  * 数据模型和关系
  * 迁移管理


### [2. 配置优于代码](https://nextdevkit.com/zh/docs/project-architecture#2-%E9%85%8D%E7%BD%AE%E4%BC%98%E4%BA%8E%E4%BB%A3%E7%A0%81)
  * **集中式配置** - 无需修改组件即可更改行为
  * **类型安全配置** - TypeScript 确保正确性
  * **基于环境** - 开发/预发布/生产环境的不同配置


### [3. 模块化架构](https://nextdevkit.com/zh/docs/project-architecture#3-%E6%A8%A1%E5%9D%97%E5%8C%96%E6%9E%B6%E6%9E%84)
  * **独立模块** - AI、积分、支付、邮件、存储是自包含的
  * **提供商模式** - 易于自己实现新的提供商
  * **功能文件夹** - 相关代码放在一起


## [目录参考](https://nextdevkit.com/zh/docs/project-architecture#%E7%9B%AE%E5%BD%95%E5%8F%82%E8%80%83)
以下是查找特定功能的快速参考：
### [前端](https://nextdevkit.com/zh/docs/project-architecture#%E5%89%8D%E7%AB%AF)
  * **页面** → `src/app/`
  * **组件** → `src/components/`
  * **样式** → `src/app/globals.css`、`src/styles/`
  * **资源** → `public/`


### [后端](https://nextdevkit.com/zh/docs/project-architecture#%E5%90%8E%E7%AB%AF)
  * **数据库** → `src/database/`
  * **API 路由** → `src/app/api/`
  * **服务器操作** → `src/lib/actions/`、`src/credits/actions/`、`src/payment/actions/`
  * **认证** → `src/lib/auth/`


### [业务逻辑](https://nextdevkit.com/zh/docs/project-architecture#%E4%B8%9A%E5%8A%A1%E9%80%BB%E8%BE%91)
  * **AI** → `src/ai/`
  * **积分** → `src/credits/`
  * **支付** → `src/payment/`
  * **邮件** → `src/mail/`
  * **存储** → `src/storage/`


### [配置](https://nextdevkit.com/zh/docs/project-architecture#%E9%85%8D%E7%BD%AE)
  * **应用配置** → `src/config/`
  * **内容** → `src/content/`
  * **翻译** → `messages/`
  * **环境变量** → `.env.local`


### [开发](https://nextdevkit.com/zh/docs/project-architecture#%E5%BC%80%E5%8F%91)
  * **迁移** → `drizzle/`
  * **Docker** → `Dockerfile`
  * **类型** → `src/types/`


## [常见模式](https://nextdevkit.com/zh/docs/project-architecture#%E5%B8%B8%E8%A7%81%E6%A8%A1%E5%BC%8F)
### [添加新功能](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E5%8A%9F%E8%83%BD)
  1. 在 `src/app/` 中**创建页面路由**
  2. 在 `src/components/[feature]/` 中**构建组件**
  3. 在 `src/lib/actions/` 或 `src/[feature]/actions/` 中**添加服务器操作**
  4. 在 `src/config/` 中**更新配置**
  5. 在 `messages/` 中**添加翻译**


### [添加新的支付提供商](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86)
  1. 在 `src/payment/providers/new-provider.ts` 中创建提供商
  2. 实现所需的接口
  3. 更新 `src/payment/actions/`
  4. 在 `src/config/index.ts` 中添加配置
  5. 在 `src/app/api/webhooks/` 中更新 webhook 处理器


### [添加新的 AI 模型](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84-ai-%E6%A8%A1%E5%9E%8B)
  1. 在 `src/ai/models/` 中添加模型配置
  2. 在 `src/ai/prompts.ts` 中更新提示词
  3. 在 `src/app/api/ai/` 中创建 API 路由
  4. 在 `src/components/examples/ai/` 中添加 UI 组件


### [添加新语言](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E8%AF%AD%E8%A8%80)
  1. 创建 `messages/[locale].json`
  2. 将 locale 添加到 `src/config/index.ts`
  3. 更新 `src/i18n/routing.ts`
  4. 使用 `http://localhost:3000/[locale]` 测试


## [下一步](https://nextdevkit.com/zh/docs/project-architecture#%E4%B8%8B%E4%B8%80%E6%AD%A5)
现在你已经了解了架构：
  1. **探索代码** - 打开文件，查看它们如何连接
  2. **尝试做出更改** - 修改组件或配置
  3. **阅读特定指南** - 认证、支付、积分、AI 集成
  4. **构建你的功能** - 将这些模式应用到你的用例中


该架构设计为随着应用程序的增长而保持清晰和可维护性。
[集成 AI 工具 本教程将帮助你快速上手 NEXTDEVKIT 配合 AI IDE 使用，包括 AI Rules 和 MCP 的安装和使用。](https://nextdevkit.com/zh/docs/ai-agents)[Landing Page 启动配置 从最小启动到完整配置的渐进式指南，帮助你快速启动和定制 NEXTDEVKIT Landing Page。](https://nextdevkit.com/zh/docs/project-landing)
[](https://nextdevkit.com/zh/docs/project-architecture#%E7%90%86%E8%A7%A3%E6%BC%94%E8%BF%9B%E8%BF%87%E7%A8%8B)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-1%E5%9F%BA%E7%A1%80---nextjs-%E5%9F%BA%E7%A1%80)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-2%E6%B7%BB%E5%8A%A0%E5%9F%BA%E7%A1%80%E5%B7%A5%E5%85%B7)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-3%E4%BD%BF%E7%94%A8-app-router-%E7%BB%84%E7%BB%87%E8%B7%AF%E7%94%B1)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-4%E7%BB%84%E4%BB%B6%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-5-%E5%86%85%E5%AE%B9%E7%AE%A1%E7%90%86)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-6%E6%95%B0%E6%8D%AE%E5%BA%93%E5%92%8C%E8%AE%A4%E8%AF%81)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-7api-%E8%B7%AF%E7%94%B1%E5%92%8C%E6%9C%8D%E5%8A%A1%E5%99%A8%E5%87%BD%E6%95%B0)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-8%E4%B8%9A%E5%8A%A1%E9%80%BB%E8%BE%91%E6%A8%A1%E5%9D%97)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%AD%A5%E9%AA%A4-9%E5%AE%8C%E6%95%B4%E7%9A%84%E7%94%9F%E4%BA%A7%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%9E%B6%E6%9E%84%E5%8E%9F%E5%88%99)[](https://nextdevkit.com/zh/docs/project-architecture#1-%E5%85%B3%E6%B3%A8%E7%82%B9%E5%88%86%E7%A6%BB)[](https://nextdevkit.com/zh/docs/project-architecture#2-%E9%85%8D%E7%BD%AE%E4%BC%98%E4%BA%8E%E4%BB%A3%E7%A0%81)[](https://nextdevkit.com/zh/docs/project-architecture#3-%E6%A8%A1%E5%9D%97%E5%8C%96%E6%9E%B6%E6%9E%84)[](https://nextdevkit.com/zh/docs/project-architecture#%E7%9B%AE%E5%BD%95%E5%8F%82%E8%80%83)[](https://nextdevkit.com/zh/docs/project-architecture#%E5%89%8D%E7%AB%AF)[](https://nextdevkit.com/zh/docs/project-architecture#%E5%90%8E%E7%AB%AF)[](https://nextdevkit.com/zh/docs/project-architecture#%E4%B8%9A%E5%8A%A1%E9%80%BB%E8%BE%91)[](https://nextdevkit.com/zh/docs/project-architecture#%E9%85%8D%E7%BD%AE)[](https://nextdevkit.com/zh/docs/project-architecture#%E5%BC%80%E5%8F%91)[](https://nextdevkit.com/zh/docs/project-architecture#%E5%B8%B8%E8%A7%81%E6%A8%A1%E5%BC%8F)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E5%8A%9F%E8%83%BD)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84%E6%94%AF%E4%BB%98%E6%8F%90%E4%BE%9B%E5%95%86)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E7%9A%84-ai-%E6%A8%A1%E5%9E%8B)[](https://nextdevkit.com/zh/docs/project-architecture#%E6%B7%BB%E5%8A%A0%E6%96%B0%E8%AF%AD%E8%A8%80)[](https://nextdevkit.com/zh/docs/project-architecture#%E4%B8%8B%E4%B8%80%E6%AD%A5)
## We use cookies
We use cookies to ensure you get the best experience on our website.
Accept allReject all
Manage Individual preferences
[Terms of Service](https://nextdevkit.com/legal/terms-of-service) [Privacy Policy](https://nextdevkit.com/legal/privacy-policy)
