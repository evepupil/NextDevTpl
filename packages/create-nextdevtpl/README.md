# create-nextdevtpl

[中文](README.md) | [English](README.en.md)

从官方预设或自定义模块、服务选择生成独立的 Next.js SaaS 应用。生成项目拥有自己的源码，运行时不依赖
`create-nextdevtpl`。3.x 运营模块提供类型化埋点、管理员指标看板、AI 成本读模型、每日快照，以及安全的邮件或签名 Webhook 告警。

需要 Node.js 24 和 pnpm 10。

## 快速开始

```bash
pnpm dlx create-nextdevtpl@2.6.0 my-app --preset saas --target vercel
```

## 预设、目标和服务

- 预设：`minimal`、`saas`、`ai-saas`、`custom`
- 部署目标：`server`、`docker`、`vercel`、`cloudflare`
- 服务：支付、存储、邮件、AI、告警、分析、任务和限流

主要服务参数为 `--payment`、`--storage`、`--mail`、`--ai`、`--alerts`、`--analytics`、
`--jobs` 和 `--rate-limit`。运行 `--help` 查看可用值；`--alerts` 需要同时选择 `operations`。

省略 `--preset` 时，`server` 目标默认生成 `minimal`。需要自定义模块或覆盖服务时使用 `custom`：

```bash
pnpm dlx create-nextdevtpl@2.6.0 my-app \
  --preset custom \
  --modules auth,analytics,operations \
  --target docker \
  --payment stripe \
  --alerts webhook \
  --analytics posthog \
  --mail smtp \
  --rate-limit noop
```

选择 `operations` 后，生成器会自动补齐后台和支付依赖。生成清单和 `.env.example` 会列出最终保留的文件与变量。
运营模块提供 `/admin/operations`、`/api/jobs/operations/snapshot` 和
`/api/jobs/operations/alerts`；请用部署平台调度受保护的 Cron，并把缺少分析数据看作明确状态，不要当成零活跃。

生成器会解析模块依赖、删除未选择的源码和依赖、生成选择专用的 `.env.example`，并写入
`nextdevtpl.generated.json`。保留该清单，后续升级时用它还原相同组合并比较差异。

```bash
pnpm dlx create-nextdevtpl@2.6.0 --help
```

## 文档

生成项目内置中文和英文文档，入口分别为 `/zh/docs` 和 `/en/docs`。仓库中的完整说明见
[NextDevTpl README](https://github.com/evepupil/NextDevTpl#readme)。

## 许可证

MIT
