# Quick Start

5 分钟快速启动 NextDevTpl 开发环境。

## 前置要求

| 工具 | 版本 | 安装方式 |
|------|------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| pnpm | 8+ | `npm install -g pnpm` |
| PostgreSQL | 任意 | 本地安装 / [Neon](https://neon.tech)（推荐） |

## 第一步：安装项目

```bash
git clone git@github.com:evepupil/NextDevTpl.git
cd NextDevTpl
pnpm install
```

## 第二步：配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，按以下优先级配置。

### 必填项（最小启动）

只需 3 个变量即可启动：

```env
# 数据库连接
DATABASE_URL="postgresql://postgres:password@localhost:5432/nextdevtpl"

# 认证密钥（用于签名 session cookie）
# 生成命令: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-key"

# 认证 URL
BETTER_AUTH_URL="http://localhost:3000"
```

> 只配置这 3 项就能跑起来。登录方式为邮箱密码，OAuth / 邮件验证 / 支付等功能需要额外配置对应的环境变量。

### 推荐配置（完整开发体验）

```env
# GitHub OAuth — https://github.com/settings/developers
# 回调地址填: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Google OAuth — https://console.cloud.google.com/apis/credentials
# 回调地址填: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Resend 邮件 — https://resend.com
# 配置后邮箱验证和密码重置才能发送邮件
RESEND_API_KEY="re_your-api-key"
EMAIL_FROM="NextDevTpl <noreply@your-domain.com>"
```

### 可选配置（按需启用）

以下服务未配置时会自动降级，不影响启动：

| 服务 | 环境变量 | 说明 |
|------|---------|------|
| **Creem 支付** | `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET` | 订阅和一次性支付 |
| **S3/R2 存储** | `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY` | 文件上传 |
| **AI 集成** | `AI_PROVIDER`, `OPENAI_API_KEY` 等 | LLM 调用抽象层 |
| **Upstash Redis** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | API 限流 |
| **Axiom 日志** | `AXIOM_TOKEN`, `AXIOM_DATASET` | 云端结构化日志 |
| **Sentry 监控** | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | 错误追踪 |
| **Inngest** | 开发模式自动连接 | 后台任务队列 |

## 第三步：初始化数据库

```bash
# 将 Drizzle schema 推送到数据库（推荐新项目使用）
pnpm db:push
```

> 如果使用 Neon，在 [neon.tech](https://neon.tech) 创建一个免费数据库，把连接字符串填入 `DATABASE_URL` 即可。

## 第四步：启动开发服务器

```bash
pnpm dev
```

打开 http://localhost:3000 ，你应该能看到首页。

## 验证功能

启动后可以逐步验证：

1. **首页** — 访问 `http://localhost:3000`，确认页面正常渲染
2. **注册** — 点击 "Get Started" 进入注册页，用邮箱注册一个账号
3. **登录** — 注册后登录，自动跳转到 Dashboard
4. **Dashboard** — 确认侧边栏导航、积分余额、用户信息正常显示
5. **设置** — 进入 Settings 页面，修改用户名测试
6. **管理后台** — 在数据库中将你的用户 `role` 改为 `admin`，然后访问 `/admin`

## 常用命令

```bash
pnpm dev              # 启动开发服务器 (Turbopack)
pnpm build            # 生产构建
pnpm typecheck        # TypeScript 类型检查
pnpm lint             # Biome 代码检查
pnpm check            # Biome 检查 + 自动修复
pnpm db:push          # 推送 schema 到数据库
pnpm db:generate      # 生成 Drizzle 迁移文件
pnpm db:studio        # 打开 Drizzle Studio (数据库 GUI)
pnpm test:run         # 运行测试 (单次)
```

## 数据库管理

```bash
# 可视化管理数据库
pnpm db:studio
```

Drizzle Studio 会在浏览器打开，可以直接查看和编辑数据库表。

修改 `src/db/schema.ts` 后：

```bash
# 开发阶段直接推送
pnpm db:push

# 或生成迁移文件（生产部署推荐）
pnpm db:generate
pnpm db:migrate
```

## 项目结构概览

```
src/
├── app/[locale]/              # 路由（按 locale 分组）
│   ├── (marketing)/           # 首页、定价、博客（公开）
│   ├── (auth)/                # 登录、注册（未登录可访问）
│   ├── (dashboard)/           # Dashboard（需登录）
│   └── (admin)/               # 管理后台（需 admin 角色）
├── features/                  # 功能模块（各自独立）
│   ├── auth/                  # 认证 UI
│   ├── credits/               # 积分系统
│   ├── payment/               # 支付集成
│   ├── subscription/          # 订阅管理
│   ├── support/               # 工单系统
│   ├── settings/              # 用户设置
│   ├── admin/                 # 管理后台
│   ├── marketing/             # 营销组件 (header, footer, hero...)
│   ├── dashboard/             # Dashboard 布局
│   ├── mail/                  # 邮件模板
│   └── storage/               # 文件存储
├── components/ui/             # Shadcn/UI 基础组件
├── db/                        # 数据库 schema
├── lib/                       # 工具库 (auth, rate-limit, logger...)
├── i18n/                      # 国际化配置
└── config/                    # 站点、导航、支付配置
```

## 下一步

- 修改 `src/config/site.ts` 自定义品牌信息
- 修改 `src/config/nav.ts` 调整导航菜单
- 修改 `messages/en.json` 和 `messages/zh.json` 更新文案
- 修改 `src/config/subscription-plan.ts` 配置订阅方案
- 修改 `src/config/payment.ts` 接入 Creem 支付
