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

只需 3 个环境变量即可启动。详见 **[Quick Start 文档](./docs/quick-start.md)**。

```bash
git clone git@github.com:evepupil/NextDevTpl.git
cd NextDevTpl
pnpm install
cp .env.example .env.local
# 编辑 .env.local 填入 DATABASE_URL、BETTER_AUTH_SECRET、BETTER_AUTH_URL
pnpm db:push
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

## 部署

支持自有服务器部署，提供一键构建 + 推送 + 启动脚本。

### 部署方式

| 方式 | 说明 |
|------|------|
| **自有服务器（推荐）** | 通过 `deploy-build.bat` 一键部署到 Linux 服务器 |
| **Vercel** | `git push` 即可，零配置 |
| **Docker** | 自行编写 Dockerfile，`pnpm build` + `pnpm start` |

### 一键部署到服务器

项目提供了 `deploy-build.bat`（本地 Windows）+ `start-prod.sh`（服务器端）部署脚本，流程为：

**本地构建 → 打包 → 上传 → 服务器解压 → PM2 启动/重启**

#### 1. 配置部署参数

编辑 `deploy-build.bat` 头部的配置：

```bat
set "REMOTE_USER=ubuntu"          # 服务器用户名
set "REMOTE_HOST=<your-server>"   # 服务器 IP 或域名
set "REMOTE_PORT=22"              # SSH 端口
set "REMOTE_DIR=/home/ubuntu/NextjsTpl"  # 服务器上的项目目录
set "SSH_KEY=%USERPROFILE%\.ssh\id_ed25519"  # SSH 私钥路径
set "PORT=3303"                   # 应用运行端口
```

#### 2. 准备生产环境变量

```bash
# 创建生产环境变量文件（不会被提交到 Git）
cp .env.example .env.prod
# 编辑 .env.prod，填入生产环境的真实配置
```

#### 3. 服务器前置准备

```bash
# 服务器上需要安装：
# - Node.js 18+（推荐通过 nvm 安装）
# - pnpm: npm install -g pnpm
# - PM2: npm install -g pm2

# 创建项目目录
mkdir -p /home/ubuntu/NextjsTpl
```

#### 4. 执行部署

```bash
# Windows 本地执行
deploy-build.bat
```

脚本会自动完成：本地 `pnpm build` → 打包 `.next` + 配置文件 → SCP 上传 → SSH 远程解压 → PM2 启动应用。

#### 5. 服务器管理

```bash
pm2 status              # 查看应用状态
pm2 logs NextjsTpl      # 查看日志
pm2 restart NextjsTpl   # 重启应用
pm2 stop NextjsTpl      # 停止应用
```

> 服务器端通常还需要配置 Nginx 反向代理（将 80/443 端口转发到应用端口）和 SSL 证书。

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
