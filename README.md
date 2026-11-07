<p align="center">
  <br>
  <img src="public/logo.svg" alt="NextDevTpl" width="120">
  <br>
  <h1 align="center">NextDevTpl</h1>
  <p align="center">
    生成可独立维护的 Next.js SaaS 项目，按需选择皮肤、功能和运行模式。
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

NextDevTpl 4.0.0 在生成时组合皮肤、功能和部署目标。生成结果是一份独立源码，运行时不依赖生成器。完整模式 `full` 保留所选产品功能；演示模式 `demo` 使用同一套视图，但不包含业务后端。

## 快速开始

需要 Node.js 24 和 pnpm 10。

生成完整 SaaS 项目：

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --preset saas --target vercel
cd my-app
```

根据生成的 `.env.example` 配置保留服务，再初始化数据库并启动：

```bash
pnpm db:push
pnpm dev
```

生成可本地体验的前端演示项目：

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-demo --mode demo --target server
cd my-demo
pnpm dev
```

演示项目无需业务环境变量或数据库。登录、资料修改、套餐切换和工单操作只在当前标签页内存中生效；刷新或打开新标签页会恢复默认样例。它不提供真实认证、付款或业务 API。

## 完整模式

省略 `--mode` 等同于 `--mode full`。完整模式按预设或自定义选择保留模块、服务适配器和部署文件。

| 预设 | 主要范围 | 默认目标 |
| --- | --- | --- |
| `minimal` | 认证和工作区基础页面 | `server` |
| `saas` | 营销、认证、设置、订阅、积分、管理与支持 | `vercel` |
| `ai-saas` | SaaS 功能以及 AI、博客、PSEO | `cloudflare` |
| `custom` | 按参数选择模块和服务 | `server` |

完整模式支持 `server`、`docker`、`vercel` 和 `cloudflare`。支付、存储、邮件、AI、任务、限流、分析和告警由生成参数选择；生成器会补齐模块依赖，并在 `nextdevtpl.generated.json` 中记录实际选择。

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app \
  --preset custom \
  --modules auth,analytics,operations \
  --target docker \
  --payment stripe \
  --analytics posthog
```

## 皮肤与配色

皮肤在生成时选定，生成项目只包含一套皮肤，不支持运行时换肤。`--skin` 可选择内置默认皮肤、本地目录或带可信 SHA-256 的 HTTPS 归档。远端凭证从环境变量读取，不进入参数、日志、生成项目或生成记录。

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --skin ./my-skin --preset saas
```

`--palette` 只适用于内置默认皮肤。生成器随包提供 StyleKit 的 149 套离线快照；选用配色时，生成项目会附带对应署名和 MIT 许可。配色不会改变页面结构，也不会增加运行时网络请求。

皮肤需要符合当前模板版本与视图接口，声明视图入口、依赖、素材授权和文件 SHA-256。动态视图还需满足演示模式的客户端兼容要求。选择并保留 docs 功能的完整项目可查看[生成器说明](/zh/docs/generator)和[皮肤制作指南](/zh/docs/skin-authoring)。

## 演示模式

演示导出固定保留 17 条用户路由和 20 个皮肤视图，只支持 `server` 目标。它拒绝显式 `--preset`、`--modules` 和服务适配器选项，避免输出看似可用的后端选择。

皮肤可以提供 `demo/data.json` 作为严格校验的数据覆盖。样例可定义用户、套餐编号与周期、积分账目、账单历史和工单；套餐价格、月额度及权益仍由模板的统一套餐配置决定。样例时间使用固定的 UTC 参考时点，不会随运行日期变化。

## 文档

选中了文档功能的完整项目可在 `/en/docs` 和 `/zh/docs` 查看内置帮助，包括[升级与兼容性](/zh/docs/upgrade)。

生成项目属于各自维护的源码树，生成器不会覆盖已有项目。升级时应以原选择记录和新版本生成的临时对照项目为依据，人工审查并合并差异；数据库迁移先在测试环境验证。

## 许可证

MIT
