# Cloudflare Workers

> 模块定位：让生成项目可通过 OpenNext 部署到 Cloudflare Workers
>
> 对应代码：`wrangler.jsonc`、`open-next.config.ts`、`cloudflare/`、
> `packages/create-nextdevtpl/`、`src/adapters/`
>
> 所属里程碑：[M5 - v2.5 Cloudflare Workers](../roadmap2.x.md#m5)
>
> 当前状态：进行中
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

M2 已提供 R2、Workers AI、Cloudflare Email、Workflows 和 Rate Limiting
适配器，M3 已能选择 Cloudflare 目标。当前缺口是 OpenNext/Wrangler 配置、
Bindings 真实注入、Workers 数据库入口、生成后类型生成和部署验证。

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
