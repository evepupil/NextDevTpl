# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# NextDevTpl - SaaS Boilerplate

## Tech Stack & Requirements

请基于以下技术栈进行开发，不要使用过时的库：

1. **Framework**: Next.js 15 (App Router, Turbopack, React 19 RC).
2. **Language**: TypeScript (Strict Mode, no `any`).
3. **Styling**: Tailwind CSS 4 (注意 v4 的新配置方式), Shadcn/UI (作为组件库), Radix UI (底层), Framer Motion (动画).
4. **Database & ORM**: PostgreSQL, Drizzle ORM (Edge compatible), Drizzle Zod.
5. **Auth**: Better Auth (最新版).
6. **Validation**: Zod (Schema), React Hook Form, Next Safe Action (Server Actions 类型安全).
7. **Linting/Formatting**: Biome (替代 ESLint/Prettier).
8. **Package Manager**: pnpm.
9. **State Management**: Zustand, TanStack Query (只在必要时使用，优先 Server Components).
10. **Tools**: Fumadocs (文档), Lucide React (图标).

## Commands

```bash
pnpm dev          # 启动开发服务器 (Turbopack)
pnpm build        # 生产构建
pnpm start        # 启动生产服务器
pnpm lint         # Biome 代码检查
pnpm format       # Biome 格式化
pnpm check        # Biome 检查并自动修复
pnpm typecheck    # TypeScript 类型检查
```

## Architecture

### Route Groups
- `(marketing)` - 公开营销页面 (Header + Footer 布局)
- `(dashboard)` - 需认证的仪表盘 (Sidebar + Topbar 布局)

### Feature-based 结构
每个功能模块在 `src/features/` 下独立组织，包含自己的 `components/`、`data/` 等子目录。

### 路径别名
使用 `@/*` 指向 `src/*`，例如 `@/components/ui`。

## Coding Standards

- **App Router Only**: 严禁使用 `pages/` 目录。
- **Server Components**: 默认使用 RSC，只有在需要交互（onClick, useState）时才添加 `'use client'`。
- **Data Fetching**: 在 Server Components 中直接调用 DB/Drizzle，不要使用 API Routes (`app/api/*`) 获取内部数据，除非是 Webhook 或对外 API。
- **Server Actions**: 所有的变异操作（Mutations/POST）必须使用 Server Actions 配合 `next-safe-action`。
- **Type Safety**: 所有的 Props、API 响应、DB Schema 必须有完整的类型定义。

## Project Structure

```
src/
├── app/           # Next.js App Router (route groups: marketing, dashboard)
├── components/    # 共享组件 (ui/, marketing/, dashboard/)
├── features/      # Feature-based 模块 (marketing, dashboard, blog, etc.)
├── lib/           # 工具函数 (cn() 等)
├── db/            # Drizzle ORM schema 和配置
├── actions/       # Server Actions
├── hooks/         # 自定义 React Hooks
└── types/         # TypeScript 类型定义
```

## TODO

- [ ] **Google OAuth 登录报错 `invalid_code`** - 配置看起来正确，但回调时返回无效代码错误。需要进一步排查 Better Auth 与 Google OAuth 的兼容性问题。
- [ ] **GitHub OAuth 登录报错 `unable_to_get_user_info`** - 移除了 `mapProfileToUser` 配置后仍报错，可能是 GitHub 邮箱隐私设置或 OAuth App 配置问题。
