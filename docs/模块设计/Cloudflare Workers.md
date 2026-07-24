# Cloudflare Workers

> 模块定位：让生成项目可通过 OpenNext 部署到 Cloudflare Workers
>
> 对应代码：`wrangler.jsonc`、`open-next.config.ts`、`cloudflare/`、
> `packages/create-nextdevtpl/`、`src/adapters/`
>
> 所属里程碑：[M5 - v2.5 Cloudflare Workers](../roadmap2.x.md#m5)
>
> 当前状态：已完成
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
- Cloudflare 目标默认开启 Wrangler minify，并用轻量 HTML 事务邮件替代运行时
  React Email 渲染。该目标不生成动态 Open Graph 与 Twitter 图片路由，避免把
  Resvg、Yoga WASM、字体和 `@vercel/og` 一起打入 Worker；其他部署目标保持原能力。

## 当前实现

- 根模板已加入 OpenNext、Wrangler、Workers 入口和构建、预览、部署、类型生成
  命令。Open Graph 与 Twitter 图片改用 Node.js runtime，满足 OpenNext 构建要求。
- 生成器只为 Cloudflare 目标保留 OpenNext 文件和依赖，并按所选适配器生成 R2、
  Workers AI、Email、Workflow 和六组 Rate Limiting Bindings；生成完成后自动执行
  `wrangler types`。
- Cloudflare 目标使用 Neon HTTP，移除 `pg`、`ws` 和 Sentry 依赖。监控保留
  `console` 错误日志，Sentry 上报和 tracing 在该目标中暂不提供。生成器还会
  用 Workers 专用 `console` logger 替换 Pino，并移除 `pino` 与 `pino-pretty`，
  避免 Pino 的 Node.js stdout 写入在 Worker 内触发运行时异常。
- 服务层在方法调用时读取当前 Workers 请求上下文，把真实 Binding 延迟注入 M2
  适配器，避免模块加载阶段访问请求上下文。
- 非 Cloudflare 目标会清理所有 Workers 文件、脚本和依赖；未选择 marketing 时也会
  清理社交图片路由，保持生成结果可构建。
- Cloudflare 生成结果会清理 React Email 的三个依赖和 JSX 邮件模板，保留重置密码、
  邮箱验证、纯文本回退、HTML 转义与 Cloudflare Email Binding 发信链路。
- `wrangler.jsonc` 固化 `minify: true`，`cf:deploy` 同时显式传入 `--minify`，降低用户
  绕过压缩后触发免费额度限制的风险。
- 兼容性结构检查会确认 Cloudflare 生成结果不再携带 Pino，并验证专用 logger
  已落入最终项目；logger 自身的上下文合并和错误级别输出有独立单测。

## 已完成验证

### 根项目门禁

- `pnpm format`、`pnpm lint`、根项目与生成器严格类型检查全部通过。
- 全量 Vitest 通过，共 27 个测试文件、329 个用例；Node.js 生产构建通过。
- `ai-saas` 生成项目自动验证通过，覆盖依赖安装、初始迁移、lint、typecheck、
  生成结果测试和 Node.js 生产构建。

### 完整 `ai-saas` 组合

- 生成、依赖安装、初始迁移、`wrangler types`、lint、typecheck 和生成项目冒烟测试
  均通过。
- 原始完整产物为 `4704.50 KiB gzip`，仅启用 minify 后为 `4231.77 KiB gzip`。
  最大的可独立裁剪来源是动态社交图片：它会引入 `@vercel/og`、Resvg WASM、
  Yoga WASM 和字体，移除后降到 `3470.43 KiB gzip`。
- React Email 运行时渲染器是第二个主要来源。Cloudflare 目标改用轻量事务邮件后，
  正式生成产物降到 `2266.45 KiB gzip`，同时保留 Fumadocs 文档、搜索、博客、
  pSEO、认证、支付、积分、后台、工单、Workers AI、R2 和 Workflow。
- Cloudflare 官方当前限制为 Workers Free `3 MB`、Workers Paid `10 MB`。正式产物
  低于 Free 上限约 `805 KiB`，为后续小幅业务扩展保留了余量。
- 带临时 Neon/R2 smoke 接口的部署产物为 `2281.97 KiB gzip`，Worker 启动时间
  `33 ms`，已成功发布到临时自定义域名。
- 首页、文档、完整健康检查和认证 API 均返回 HTTP 200；健康检查确认 Neon 可用。
  受保护 smoke 接口确认 R2 写入、读取和删除成功。
- Workflow 实例成功完成，持久化步骤 `complete-job-1` 执行成功。验证结束后，临时
  自定义域名、Worker、Workflow 和自动预配的 R2 bucket 已全部删除并通过 API 复核。

### M6 稳定性复验

- M6 完整 `ai-saas` 生成结果在 WSL 独立安装 877 个包，OpenNext 构建和 Wrangler
  dry-run 通过；压缩后为 `2280.94 KiB gzip`，比 Free `3 MB` 上限低约
  `791 KiB`。
- 第一次线上健康检查发现 Pino 仍尝试通过 `node:fs` 写 stdout，导致请求在
  `SonicBoom` 内失败。生成器改用专用 `console` logger 后重新生成并部署，Worker
  启动时间为 `26 ms`。
- 临时自定义域名上的首页最终响应 HTTP 200，认证 session API 和 `/api/health`
  均为 HTTP 200；健康报告中的配置、应用和 Neon 数据库检查全部为 `pass`。
- 验证结束后，自定义域名、Worker、Workflow、8 个 secrets 和自动预配 R2 bucket
  均已删除；API 与 Wrangler 复核确认资源不存在。

### 最小部署组合

- 使用 auth、dashboard、R2 和 Workflow 生成最小项目，安装、迁移、类型生成、
  lint、typecheck、测试、OpenNext build 和 Wrangler dry-run 均通过。
- Worker 压缩后为 `2240.61 KiB`，已部署到
  `https://nextdevtpl-m5-smoke.yeton92479.workers.dev`，启动时间 `30 ms`。
- 已从 `.env.test` 同步 8 个 Worker secrets；文档和日志不记录任何 secret 值。
- 已通过 Wrangler 触发 Workflow，实例在 1 秒内完成，持久化步骤
  `complete-job-1` 执行成功。部署时 R2 bucket 已自动预配。

## 已知限制

1. Cloudflare 免费组合使用轻量事务邮件，不提供 React Email 组件预览。需要复杂邮件
   设计时，可扩展轻量模板，或在明确接受包体增加后恢复 React Email。
2. Cloudflare 免费组合不生成动态社交图片路由。项目应使用 `public/` 中的静态社交图；
   需要按请求生成图片时，应重新评估 Paid 套餐包体余量或拆分独立图片 Worker。
3. OpenNext 构建在当前 Windows 环境会受符号链接权限限制。Windows 继续负责生成、
   安装和项目门禁；OpenNext/Linux 专项构建使用 WSL，并维护独立的 Linux
   `node_modules`。

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
- 2026-07-24：完成完整产物包体分析，Cloudflare 目标改用轻量事务邮件、静态社交图
  策略和默认 minify，完整 `ai-saas` 降至 `2266.45 KiB gzip`。临时自定义域名上的
  HTTP、认证、Neon、R2 和 Workflow 冒烟验证全部通过，测试资源已清理，M5 完成。
- 2026-07-24：M6 线上复验发现 Pino 与 Workers stdout 不兼容；生成器改为输出
  Workers 专用 `console` logger 并移除 Pino 依赖，重新部署后的健康、认证和数据库
  检查通过，临时资源已清理。
