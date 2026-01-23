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

## Coding Standards

- **App Router Only**: 严禁使用 `pages/` 目录。
- **Server Components**: 默认使用 RSC，只有在需要交互（onClick, useState）时才添加 `'use client'`。
- **Data Fetching**: 在 Server Components 中直接调用 DB/Drizzle，不要使用 API Routes (`app/api/*`) 获取内部数据，除非是 Webhook 或对外 API。
- **Server Actions**: 所有的变异操作（Mutations/POST）必须使用 Server Actions 配合 `next-safe-action`。
- **Type Safety**: 所有的 Props、API 响应、DB Schema 必须有完整的类型定义。
- **File Structure**: 使用 `src/` 目录结构。Feature-based 架构（例如 `src/features/auth`, `src/features/billing`）。

## Project Structure

```
src/
├── app/           # Next.js App Router
├── components/    # 共享组件
├── features/      # Feature-based 模块 (auth, billing, etc.)
├── lib/           # 工具函数和配置
├── db/            # Drizzle ORM schema 和配置
├── actions/       # Server Actions
├── hooks/         # 自定义 React Hooks
└── types/         # TypeScript 类型定义
```

## Key Dependencies

- `next-safe-action` - 类型安全的 Server Actions
- `drizzle-orm` + `drizzle-zod` - 类型安全的 ORM
- `better-auth` - 现代化认证方案
- `@tanstack/react-query` - 仅在必要时用于客户端数据
- `zustand` - 轻量级状态管理
- `framer-motion` - 动画
- `lucide-react` - 图标
