# Cloudflare Workers

> 模块定位：让生成项目可通过 OpenNext 部署到 Cloudflare Workers
>
> 对应代码：`wrangler.jsonc`、`open-next.config.ts`、`cloudflare/`、
> `packages/create-nextdevtpl/`、`src/adapters/`
>
> 所属里程碑：[M5 - v2.5 Cloudflare Workers](../roadmap2.x.md#m5)
>
> 当前状态：阻塞
>
> 最近更新时间：2026-07-24

## 职责与边界

本模块负责 Workers 运行环境、Bindings 和 Cloudflare 平台能力接入。通用业务
代码保持平台无关，Workers 特殊行为集中在部署 recipe 与服务适配器。

## 结构与数据流

```text
create-nextdevtpl
    |
    +-- 根据所选适配器生成 wrangler.jsonc 与 CloudflareEnv 类型
    +-- 把数据库入口改为 Neon HTTP
    +-- 把服务入口连接到 Workers env bindings
    |
    v
OpenNext 构建 .open-next/worker.js 与静态资源
    |
    v
cloudflare/worker.mjs 转发 Next.js 请求并导出 Workflow 类
    |
    +-- Neon HTTP       PostgreSQL 与 Better Auth
    +-- R2 binding      对象读写
    +-- Workflow        后台任务与失败重试
    +-- Workers AI      AI 推理（按需）
    +-- Rate Limiting   API 限流（按需）
    +-- Email Service   事务邮件（按需，需域名配置）
```

Node.js、Vercel 和 Docker 继续使用原部署入口。Cloudflare 文件只进入
`target=cloudflare` 的生成结果，其他目标不携带 OpenNext 和 Wrangler 依赖。

## 关键决策

- 使用 `@opennextjs/cloudflare` 的稳定版本和 `wrangler.jsonc`，生产入口保持
  Workers ES Module 格式。
- 首版保留 PostgreSQL Schema，Cloudflare 默认使用 Neon HTTP。Hyperdrive 需要
  账号级配置 ID，作为明确选择后再启用的扩展；D1 继续暂缓。
- 兼容日期使用生成时的当前日期，并启用 `nodejs_compat`。Bindings 类型由
  `wrangler types` 生成，禁止手写一份容易漂移的 `Env`。
- R2 使用 Wrangler 自动预配，配置文件不携带账号资源 ID。Workers AI、
  Rate Limiting、Email 和 Workflows 只在对应适配器被选择时声明。
- 服务层从 Workers 运行时 `env` 获取 Binding，再注入 M2 适配器；业务模块不
  导入 Cloudflare SDK，也不调用 Cloudflare REST API。
- 开启 Workers Logs，并使用采样配置控制日志量。密钥通过 `wrangler secret`
  管理，禁止进入 `wrangler.jsonc`。
- 测试部署先采用认证、数据库、R2 和 Workflow 组合，邮件域名和 Workers AI
  计费能力分别验收，避免基础部署被账号可选能力阻塞。

## 当前实现

- 根模板已加入 OpenNext、Wrangler、Workers 入口和构建、预览、部署、类型生成
  命令。Open Graph 与 Twitter 图片改用 Node.js runtime，满足 OpenNext 构建要求。
- 生成器只为 Cloudflare 目标保留 OpenNext 文件和依赖，并按所选适配器生成 R2、
  Workers AI、Email、Workflow 和六组 Rate Limiting Bindings；生成完成后自动执行
  `wrangler types`。
- Cloudflare 目标使用 Neon HTTP，移除 `pg`、`ws` 和 Sentry 依赖。监控保留
  `console` 错误日志，Sentry 上报和 tracing 在该目标中暂不提供。
- 服务层在方法调用时读取当前 Workers 请求上下文，把真实 Binding 延迟注入 M2
  适配器，避免模块加载阶段访问请求上下文。
- 非 Cloudflare 目标会清理所有 Workers 文件、脚本和依赖；未选择 marketing 时也会
  清理社交图片路由，保持生成结果可构建。

## 已完成验证

### 根项目门禁

- `pnpm format`、`pnpm lint`、根项目与生成器严格类型检查全部通过。
- 全量 Vitest 通过，共 26 个测试文件、326 个用例；Node.js 生产构建通过。
- `ai-saas` 生成项目自动验证通过，覆盖依赖安装、初始迁移、lint、typecheck、
  生成结果测试和 Node.js 生产构建。

### 完整 `ai-saas` 组合

- 生成、依赖安装、初始迁移、`wrangler types`、lint、typecheck 和生成项目冒烟测试
  均通过。
- OpenNext build 在 WSL 中通过，Wrangler dry-run 通过；压缩后 Worker 为约
  `4.7 MiB`。
- Cloudflare 官方当前限制为 Workers Free `3 MB`、Workers Paid `10 MB`，因此完整
  组合在当前 Free 账户无法部署，升级 Paid 后包体可进入允许范围。

### 最小部署组合

- 使用 auth、dashboard、R2 和 Workflow 生成最小项目，安装、迁移、类型生成、
  lint、typecheck、测试、OpenNext build 和 Wrangler dry-run 均通过。
- Worker 压缩后为 `2240.61 KiB`，已部署到
  `https://nextdevtpl-m5-smoke.yeton92479.workers.dev`，启动时间 `30 ms`。
- 已从 `.env.test` 同步 8 个 Worker secrets；文档和日志不记录任何 secret 值。
- 已通过 Wrangler 触发 Workflow，实例在 1 秒内完成，持久化步骤
  `complete-job-1` 执行成功。部署时 R2 bucket 已自动预配。

## 当前阻塞

1. 当前网络连接 `workers.dev` 时会被关闭，Windows、WSL、命令行和应用内浏览器
   均无法访问测试 Worker。因此 `/api/health`、认证配置和 Neon 数据库还没有完成
   线上 HTTP 验证，R2 也尚未通过 Worker 请求链路验证。
2. 完整 `ai-saas` 产物约 `4.7 MiB`，超过 Workers Free 的 `3 MB` 上限。需要把
   Cloudflare 账户升级到 Workers Paid 后再部署完整组合。
3. OpenNext 构建在当前 Windows 环境会受符号链接权限限制。Windows 继续负责生成、
   安装和项目门禁；OpenNext/Linux 专项构建使用 WSL，并维护独立的 Linux
   `node_modules`。

恢复验证需要用户完成以下任一网络条件：给测试 Worker 绑定一个本机可访问的自定义
域名，或提供可以正常访问 `workers.dev` 的网络。完整组合还需要 Workers Paid。

## 验证方式

- 根项目执行 format、lint、typecheck、完整测试和 Node.js build，防止 M5 破坏
  现有部署目标。
- Cloudflare 组合生成后执行依赖安装、`wrangler types --check`、OpenNext build、
  Wrangler dry-run 和基于 `workerd` 的测试。
- 部署测试 Worker，检查首页和 `/api/health`，确认认证配置和 Neon 数据库可用。
- 通过测试接口写入、读取并删除 R2 对象，验证 Binding 注入和对象生命周期。
- 调度测试 Workflow，读取实例状态，验证至少一个持久化步骤完成；失败重试
  逻辑由单测和 Workflow 配置共同覆盖。
- 检查产物启动时间、Workers Logs 配置和未处理的 Node.js 专用 API。

## 待扩展项

- 提供 Hyperdrive 数据库 recipe，并在用户选择时生成对应 Binding。
- 为 Cloudflare Email 增加域名接入与发信身份自动检查。
- 根据业务任务拆分专用 Workflow 类和 Cron schedules。
- 在 PostgreSQL 基线稳定后单独评估 D1 recipe。

## 参考依据

- [Cloudflare Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## 改动历史

- 2026-07-23：确定 Workers 首版技术边界。
- 2026-07-24：完成 M5 现状审计，确定 OpenNext、Neon HTTP、按需 Bindings、
  Wrangler 自动预配 R2 和通用 Workflow 的实现方案，M5 标记为进行中。
- 2026-07-24：完成 OpenNext/Wrangler、Neon HTTP、运行时 Binding 注入与生成器
  集成；最小 Worker 和 Workflow 已真实部署验证。完整组合受 Free 包体上限阻塞，
  HTTP、Neon 与 R2 受当前网络不可达阻塞，M5 状态改为阻塞。
