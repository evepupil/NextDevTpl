# Cloudflare Workers

> 模块定位：让生成项目可通过 OpenNext 部署到 Cloudflare Workers
>
> 对应代码：计划覆盖 OpenNext 配置、Workers 部署 recipe、Cloudflare 适配器
>
> 所属里程碑：[M5 - v2.5 Cloudflare Workers](../roadmap2.x.md#m5)
>
> 当前状态：未开始
>
> 最近更新时间：2026-07-23

## 职责与边界

本模块负责 Workers 运行环境、Bindings 和 Cloudflare 平台能力接入。通用业务
代码保持平台无关，Workers 特殊行为集中在部署 recipe 与服务适配器。

## 结构与数据流

Next.js 由 OpenNext 生成 Workers 产物。数据库通过 Neon HTTP 或 Hyperdrive
连接 PostgreSQL，文件进入 R2，后台任务由 Inngest 或 Workflows 执行，定时
任务映射到 Cron Triggers。

## 关键决策

- 使用当前稳定的 OpenNext Cloudflare 方案。
- 首版保留 PostgreSQL Schema，D1 暂缓。
- Wrangler 统一启用 `nodejs_compat`，兼容日期随版本维护。
- Node.js 兼容开关和额外 polyfill 必须集中管理。
- 优先使用 Bindings，只有跨平台场景才使用兼容 HTTP/S3 接口。

## 当前实现

当前代码已有 R2/S3、Neon、AI Gateway 等 Cloudflare 兼容点，但尚未完成
Workers 构建、运行时检查和真实部署验证。

## 验证方式

- 执行 `opennextjs-cloudflare build`，并在基于 `workerd` 的 preview 环境验证。
- 部署测试环境并检查首页、认证、数据库、R2 和后台任务。
- 检查产物中不存在未处理的 Node.js 专用 API。
- 验证 Cron、Queues 或 Workflows 的失败重试路径。

## 待扩展项

- 调研 Next.js 16 与 OpenNext 当前兼容矩阵。
- 确定 Hyperdrive 与 Neon HTTP 的默认选择。
- 检查现有 Middleware 是否使用 Workers 尚未支持的 Node.js API。
- 在 PostgreSQL 基线稳定后单独评估 D1 recipe。

## 参考依据

- [Cloudflare Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

## 改动历史

- 2026-07-23：确定 Workers 首版技术边界。
