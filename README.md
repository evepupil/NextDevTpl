# NextDevTpl

一个现代化的 SaaS 全栈开发模板，基于 Next.js 15 构建，包含认证、支付、积分、邮件、存储、工单、API 限流、日志、错误监控等完整的 SaaS 功能模块。

> **开箱即用**：所有可选服务（限流、日志、监控）在未配置时自动降级为本地模式，不影响使用。配置对应环境变量即可启用完整功能。

## 特性

- **Next.js 15** - App Router、Turbopack、React 19
- **TypeScript** - 严格模式，完整类型安全
- **Tailwind CSS 4** - 最新版样式系统
- **Shadcn/UI** - 高质量组件库
- **Better Auth** - 现代认证方案（邮箱密码 + OAuth）
- **Drizzle ORM** - 类型安全的数据库操作
- **Creem** - 订阅支付集成
- **积分系统** - FIFO 过期 + 复式记账
- **邮件系统** - Resend + React Email
- **存储系统** - S3/R2 兼容
- **工单系统** - 用户支持
- **管理后台** - 用户管理、数据统计
- **国际化** - next-intl 多语言支持
- **API 限流** - Upstash Redis，全局自动保护（可选）
- **结构化日志** - Pino + Axiom 云日志（可选）
- **错误监控** - Sentry 自动捕获（可选）

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 15, React 19, TypeScript |
| 样式 | Tailwind CSS 4, Shadcn/UI, Radix UI |
| 数据库 | PostgreSQL, Drizzle ORM, Neon |
| 认证 | Better Auth |
| 支付 | Creem |
| 邮件 | Resend, React Email |
| 存储 | AWS S3 / Cloudflare R2 |
| 验证 | Zod, React Hook Form, next-safe-action |
| 限流 | Upstash Redis, @upstash/ratelimit |
| 日志 | Pino, Axiom |
| 监控 | Sentry |
| 工具 | Biome, pnpm |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- PostgreSQL 数据库（推荐 [Neon](https://neon.tech)）

### 安装

```bash
# 克隆项目
git clone <your-repo-url>
cd nextdevtpl

# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env.local
```

### 配置环境变量

编辑 `.env.local` 文件：

```env
# 数据库（必填）
DATABASE_URL="postgresql://..."

# Better Auth（必填）
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth（可选）
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Creem（可选）
CREEM_API_KEY=""
CREEM_WEBHOOK_SECRET=""

# Resend 邮件（可选）
RESEND_API_KEY=""

# S3/R2 存储（可选）
STORAGE_ENDPOINT=""
STORAGE_REGION=""
STORAGE_ACCESS_KEY_ID=""
STORAGE_SECRET_ACCESS_KEY=""

# API 限流 - Upstash Redis（可选，未配置时跳过限流）
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""

# 日志 - Axiom（可选，未配置时使用 console）
# AXIOM_TOKEN=""
# AXIOM_DATASET="nextdevtpl"

# 错误监控 - Sentry（可选，未配置时使用 console）
# NEXT_PUBLIC_SENTRY_DSN=""
# SENTRY_AUTH_TOKEN=""
```

### 数据库初始化

```bash
# 方式一：直接推送 schema（推荐新项目使用）
pnpm db:push

# 方式二：使用迁移文件
pnpm db:migrate
```

> **说明**：
> - `db:push` 会直接将 schema 同步到数据库，适合新项目初始化
> - `db:migrate` 会执行 `drizzle/` 目录下的迁移文件
> - 开发过程中修改 schema 后，运行 `pnpm db:generate` 生成新的迁移文件

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/                          # Next.js App Router
│   └── [locale]/                 # 国际化路由
│       ├── (marketing)/          # 营销页面（公开）
│       ├── (dashboard)/          # 用户仪表盘（需登录）
│       └── (admin)/              # 管理后台（需管理员）
├── components/ui/                # Shadcn/UI 基础组件
├── shared/                       # 全局共享组件
│   ├── providers.tsx             # 主题等 Provider
│   ├── mode-toggle.tsx           # 暗色模式切换
│   ├── language-switcher.tsx     # 语言切换
│   └── icons/                    # 图标
├── features/                     # Feature-based 模块
│   ├── marketing/components/     # header, footer, hero, pricing...
│   ├── dashboard/components/     # sidebar, topbar, cards...
│   ├── admin/components/         # admin-sidebar
│   ├── ai/components/            # chat-interface
│   ├── auth/components/          # 认证相关
│   ├── blog/components/          # 博客相关
│   ├── settings/components/      # 设置相关
│   └── support/components/       # 工单支持
├── db/                           # 数据库 Schema
├── lib/                          # 工具函数
│   ├── auth/                     # 认证相关
│   ├── rate-limit/               # API 限流
│   ├── logger/                   # 结构化日志
│   └── monitoring/               # 错误监控 (Sentry)
├── credits/                      # 积分系统
├── mail/                         # 邮件系统
├── storage/                      # 存储系统
└── config/                       # 配置文件
```

## 功能模块

### 认证系统

- 邮箱密码注册/登录
- GitHub/Google OAuth
- 会话管理
- 用户角色（user/admin）

### 支付系统

- Creem 订阅
- 多种定价方案
- Webhook 处理
- 订阅管理

### 积分系统

- FIFO 过期机制
- 复式记账
- 批次管理
- 交易历史

### 邮件系统

- React Email 模板
- Resend 发送
- 开发模式预览

### 存储系统

- S3/R2 兼容
- 预签名上传
- 文件管理

### 工单系统

- 用户创建工单
- 消息对话
- 状态管理
- 管理员回复

### 管理后台

- 数据统计面板
- 用户管理（搜索、角色、封禁）
- 积分充值
- 工单处理

### API 限流

- Upstash Redis 滑动窗口
- Middleware 全局自动保护
- 路由级别差异化限制
- 未配置时自动跳过

### 日志系统

- Pino 结构化日志
- Axiom 云日志集成
- Server Action 错误自动记录
- 未配置时回退 console

### 错误监控

- Sentry 自动捕获
- Server Action 错误自动上报
- 用户上下文关联
- 未配置时回退 console

## 命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产服务器
pnpm lint         # 代码检查
pnpm format       # 代码格式化
pnpm check        # 检查并自动修复
pnpm typecheck    # 类型检查
pnpm db:generate  # 生成迁移
pnpm db:push      # 推送 Schema
pnpm db:studio    # 打开 Drizzle Studio
```

## 路由说明

| 路由 | 说明 | 权限 |
|------|------|------|
| `/` | 首页 | 公开 |
| `/pricing` | 定价页 | 公开 |
| `/blog` | 博客 | 公开 |
| `/docs` | 文档 | 公开 |
| `/sign-in` | 登录 | 公开 |
| `/sign-up` | 注册 | 公开 |
| `/dashboard` | 仪表盘 | 登录用户 |
| `/dashboard/support` | 我的工单 | 登录用户 |
| `/settings` | 设置 | 登录用户 |
| `/admin` | 管理后台 | 管理员 |
| `/admin/users` | 用户管理 | 管理员 |
| `/admin/tickets` | 工单管理 | 管理员 |

## 开发规范

- **Server Components 优先** - 只在需要交互时使用 `'use client'`
- **Server Actions** - 所有数据变更使用 next-safe-action
- **类型安全** - 所有 Props、API 响应必须有类型定义
- **Feature-based** - 按功能模块组织代码

## License

MIT
