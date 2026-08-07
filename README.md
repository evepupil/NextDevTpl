<p align="center">
  <br>
  <img src="public/logo.svg" alt="NextDevTpl" width="120">
  <br>
  <h1 align="center">NextDevTpl</h1>
  <p align="center">
    可组合、可直接用于生产的 Next.js SaaS 模板。
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/create-nextdevtpl"><img src="https://img.shields.io/npm/v/create-nextdevtpl" alt="npm 版本"></a>
    <a href="https://github.com/evepupil/NextDevTpl/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT 许可证"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" alt="TypeScript 严格模式"></a>
    <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-10-orange?logo=pnpm" alt="pnpm 10"></a>
  </p>
</p>

[中文](README.md) | [English](README.en.md)

NextDevTpl 3.x 会按你的选择生成一个独立应用，只保留选中的模块、服务适配器、依赖、环境变量、
数据库 Schema 和部署文件。生成后的源码归你的项目所有，运行时不依赖生成器。

3.x 运营工具包提供类型安全、尊重用户同意状态的埋点，可选的管理员运营看板，以及收入、AI 成本、
系统健康指标和去重告警。运营读模型保存在生成项目自己的数据库中。

## 快速开始

需要 Node.js 24 和 pnpm 10。

```bash
pnpm dlx create-nextdevtpl@latest my-app --preset saas --target vercel
cd my-app
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
pnpm db:push
pnpm dev
```

macOS 或 Linux：

```bash
cp .env.example .env.local
pnpm db:push
pnpm dev
```

省略 `--preset` 时默认生成 `minimal`。当前 CLI 使用参数驱动，运行下面的命令查看所有选项：

```bash
pnpm dlx create-nextdevtpl@latest --help
```

## 预设

| 预设 | 包含的产品范围 | 默认服务 | 默认目标 |
| --- | --- | --- | --- |
| `minimal` | 认证和 Dashboard | 禁用邮件、无操作限流 | Server |
| `saas` | 营销、认证、Dashboard、设置、后台、支持、订阅、积分 | Creem、S3 兼容存储、Resend、Inngest、Upstash | Vercel |
| `ai-saas` | 完整 SaaS，并包含分析、博客和 PSEO | Stripe、R2 Binding、Cloudflare Email、Workers AI、Workflows、Cloudflare 限流 | Cloudflare Workers |
| `custom` | 通过参数选择的模块和适配器 | 禁用邮件、无操作限流 | Server |

模块依赖会自动补齐。例如选择 `support` 会自动带入积分、支付、订阅、邮件、认证、共享 UI 和所需
数据库 Schema。

```bash
pnpm dlx create-nextdevtpl@latest my-app \
  --preset custom \
  --modules auth,analytics,operations \
  --target docker \
  --payment stripe \
  --alerts webhook \
  --analytics posthog \
  --rate-limit noop
```

`operations` 会自动带入后台和支付依赖。生成后的 `nextdevtpl.generated.json` 是选择结果的唯一事实来源，
请根据生成的 `.env.example` 配置保留下来的分析和告警变量。

## 能力概览

| 领域 | 能力 |
| --- | --- |
| 框架 | Next.js 16 App Router、React 19、Tailwind CSS 4、Shadcn/UI、严格 TypeScript |
| 认证 | Better Auth 邮箱密码、GitHub/Google OAuth、会话、用户和管理员角色 |
| 数据库 | PostgreSQL、Drizzle ORM、分组 Schema、迁移和集成测试 |
| 支付 | 统一支付契约、Creem/Stripe、订阅、一次性购买和已验证 Webhook |
| 积分 | 双重记账、FIFO 消费、批次过期、订阅发放幂等 |
| 邮件 | 禁用、Resend、SMTP、Cloudflare Email 适配器 |
| 存储 | S3 兼容预签名上传或 Cloudflare R2 Binding |
| AI | OpenAI 兼容接口、Anthropic、Workers AI，统一服务入口 |
| 任务 | Inngest 或 Cloudflare Workflows，统一任务接口和受保护 Cron |
| 限流 | Upstash、Cloudflare Rate Limiting Binding 或本地无操作适配器 |
| 产品界面 | 多语言营销页、文档、博客、PSEO、Dashboard、设置、后台和工单 |
| 运营 | 健康检查、结构化日志、可选 Axiom/Sentry、类型化埋点、运营看板、AI 成本估算、快照、告警和兼容性门禁 |

## 服务适配器

生成时为每项服务选择一个适配器。仅支持 Workers 的适配器需要 `cloudflare` 目标，Node 专用适配器不能用于该目标。

| 服务 | 可选适配器 |
| --- | --- |
| 支付 | `creem`、`stripe`、`none` |
| 存储 | `s3-compatible`、`r2-binding`、`none` |
| 邮件 | `disabled`、`resend`、`smtp`、`cloudflare-email` |
| AI | `openai-compatible`、`anthropic`、`workers-ai`、`none` |
| 任务 | `inngest`、`cloudflare-workflows`、`none` |
| 限流 | `noop`、`upstash`、`cloudflare-rate-limit` |
| 告警 | `noop`、`email`、`webhook`（选择 `operations` 后可用） |
| 分析 | `noop`、`logger`、`posthog`、`ga4`、`umami`、`none` |

业务代码从 `src/services` 引入稳定服务，供应商 SDK 和 Binding 只保留在 `src/adapters`，方便后续替换。

## 运营工具包

选择 `operations` 模块后，会得到 `/admin/operations` 管理员页面、服务端收入与订阅健康、AI 用量和估算成本、
每日快照，以及受保护的 `/api/jobs/operations/alerts` 告警入口。模块不会自动退款、封禁用户、修改套餐或关闭服务。

内置事件包括 `landing.viewed`、`signup.completed`、`first_value.completed`、`subscription.activated`、
`core_action.completed`、`api.request.failed`、`action.failed` 和 `job.failed`。每个产品的首次价值和核心动作
需要在生成项目中明确接入，模板不会替你猜测。

详细的指标口径、隐私边界、供应商配置、Cron 调度和故障排查见
[中文运营文档](src/content/docs/zh/operations.mdx)。

## 部署目标

| 目标 | 生成的部署文件 | 构建或启动命令 |
| --- | --- | --- |
| `server` | Next.js standalone、systemd 示例、服务器构建和启动脚本 | `pnpm deploy:server:build` |
| `docker` | 多阶段 Dockerfile、Compose 应用、迁移和 PostgreSQL 服务 | `docker compose --env-file .env.production up -d --build` |
| `vercel` | `vercel.json`、健康检查和可选 Cron 配置 | Vercel Git 部署或 CLI |
| `cloudflare` | OpenNext、Worker 入口、Wrangler Binding 和 Worker 兼容替代实现 | `pnpm cf:build` / `pnpm cf:deploy` |

每个目标都提供 `/api/health`。部署后可执行：

```bash
pnpm deploy:check -- https://your-domain.example/api/health
```

Cloudflare OpenNext 在 Windows 上可能受符号链接权限影响，请在 WSL 或 Linux CI 中执行 `pnpm cf:build`。

## 项目结构

```text
src/
├── app/                 # 多语言 App Router 页面和 API
├── core/modules/        # 模块契约和校验
├── core/services/       # 与供应商无关的服务契约
├── modules/             # 根据选择生成的模块注册表
├── adapters/            # 选中的供应商实现
├── services/            # 面向业务的服务实例
├── features/            # 认证、支付、积分、支持、营销等功能
├── db/schema/           # 按选择保留的 Schema 分组
└── content/docs/        # 内置中英文用户文档

recipes/catalog.json                 # 模块、适配器和预设
packages/create-nextdevtpl/          # 发布的项目生成器
nextdevtpl.generated.json            # 生成项目中的选择记录
tests/compatibility/                  # 支持的组合矩阵
deploy/                              # 各部署目标说明
```

## 文档

生成的 `saas` 和 `ai-saas` 项目在 `/en/docs` 和 `/zh/docs` 提供内置文档。源码中的中文入口包括：

- [快速开始](src/content/docs/zh/quick-start.mdx)
- [生成器和预设](src/content/docs/zh/generator.mdx)
- [功能模块](src/content/docs/zh/feature-modules.mdx)
- [服务适配器](src/content/docs/zh/service-adapters.mdx)
- [配置](src/content/docs/zh/configuration.mdx)
- [运营工具包](src/content/docs/zh/operations.mdx)
- [部署](src/content/docs/zh/deployment.mdx)
- [升级与兼容性](src/content/docs/zh/upgrade.mdx)

对应的英文页面位于 `src/content/docs/en`。

## 参与开发

```powershell
git clone git@github.com:evepupil/NextDevTpl.git
cd NextDevTpl
pnpm install
Copy-Item .env.example .env.local
pnpm db:push
pnpm dev
```

质量门禁：

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm verify:generated
pnpm verify:compatibility:structure
pnpm release:check
```

## 升级方式

生成项目是独立源码树，NextDevTpl 3.x 不会覆盖已有项目。升级时，用相同的
`nextdevtpl.generated.json` 生成临时对照项目，审查差异，小批量合并变更，在测试数据库执行迁移，
通过完整质量门禁后再发布。

## 许可证

MIT
