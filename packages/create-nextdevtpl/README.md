# create-nextdevtpl

[中文](README.md) | [English](README.en.md)

使用 `create-nextdevtpl` 4.0.0 从官方预设或自定义选择生成独立 Next.js SaaS 项目。生成项目拥有自己的源码，运行时不依赖本包。

需要 Node.js 24 和 pnpm 10。

## 快速开始

完整 SaaS 项目：

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --preset saas --target vercel
```

纯前端演示项目：

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-demo --mode demo --target server
```

查看当前 CLI 的完整帮助：

```bash
pnpm dlx create-nextdevtpl@4.0.0 --help
```

## 模式

省略 `--mode` 时默认为 `full`。

| 模式 | 行为 | 部署目标 |
| --- | --- | --- |
| `full` | 按预设或自定义参数选择模块、服务和平台 | `server`、`docker`、`vercel`、`cloudflare` |
| `demo` | 固定保留 17 条用户路由和 20 个视图；业务交互仅更新当前标签页的内存样例，不包含真实认证、支付、API 或数据库 | 仅 `server` |

完整模式省略 `--preset` 时使用 `minimal`，目标取所选预设的默认值；演示模式固定使用 `server`。

演示模式拒绝显式 `--preset`、`--modules` 和服务适配器选项。皮肤、配色、`--yes` 与 `--no-install` 仍可使用。

## 模式与完整模式参数

| 参数 | 值 |
| --- | --- |
| `--mode` | `full` 或 `demo`；省略为 `full` |
| `--preset` | `minimal`、`saas`、`ai-saas`、`custom` |
| `--modules` | 逗号分隔的模块编号，配合 `--preset custom` 使用 |
| `--target` | `server`、`docker`、`vercel`、`cloudflare` |
| `--payment` | `creem`、`stripe`、`none` |
| `--storage` | `s3-compatible`、`r2-binding`、`none` |
| `--mail` | `disabled`、`resend`、`smtp`、`cloudflare-email` |
| `--ai` | `openai-compatible`、`anthropic`、`workers-ai`、`none` |
| `--alerts` | `noop`、`email`、`webhook` |
| `--analytics` | `noop`、`logger`、`posthog`、`ga4`、`umami`、`none` |
| `--jobs` | `inngest`、`cloudflare-workflows`、`none` |
| `--rate-limit` | `noop`、`upstash`、`cloudflare-rate-limit` |

选择 `operations` 时，告警参数才有对应的运营入口。运行 `--help` 获取随包发布的准确参数列表。

## 皮肤来源

`--skin` 选择生成时使用的皮肤。每个生成项目只包含所选的一套皮肤。

| 来源 | 示例 | 说明 |
| --- | --- | --- |
| 内置默认皮肤 | `--skin default` | 省略 `--skin` 时的默认值 |
| 本地目录 | `--skin ./my-skin` | 目录根部直接包含 `skin.json` |
| HTTPS 归档 | `--skin https://example.test/skin.tgz --skin-sha256 <64位摘要>` | 必须提供可信归档 SHA-256；URL 不可包含凭据、查询或片段 |

远端凭证只从环境变量读取。默认变量名为 `NEXTDEVTPL_SKIN_TOKEN`；也可通过 `--skin-token-env NAME` 指定变量名。这个参数接收名称，不接收令牌值。显式指定变量时，环境中必须存在非空值。令牌只用于下载授权，不写入日志、生成结果、锁文件或生成项目，也不会传给安装脚本。

本地示例：

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --skin ./my-skin --preset saas
```

远端示例：

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app \
  --skin https://skins.example.test/team/skin.tgz \
  --skin-sha256 <trusted-sha256> \
  --skin-token-env NEXTDEVTPL_SKIN_TOKEN \
  --preset saas
```

## StyleKit 配色

`--palette <slug>` 仅适用于支持配色的内置默认皮肤。包内快照包含 149 套主题，生成时离线读取；生成不会访问 StyleKit。选择后，项目中会附带所选主题的 `STYLEKIT-LICENSE.txt`。

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app \
  --preset saas \
  --palette glassmorphism
```

本参数只调整默认皮肤声明支持的颜色与圆角，不切换页面、组件或布局。其他皮肤指定 `--palette` 会被拒绝。

## 演示数据与生成记录

皮肤可在 `skin.json` 中声明可选入口：

```json
{
  "demo": {
    "data": "demo/data.json"
  }
}
```

该 JSON 必须是皮肤 `files` 哈希清单中的普通文件，最大 256 KiB，并通过严格的版本化字段、枚举、唯一编号、整数和 UTC 日期校验。数组整体替换，对象递归覆盖；不执行 JSON 中的代码或动作。套餐价格与权益不能由皮肤数据改写。

只有 `--mode demo` 会解析和合并这个 JSON。完整模式仍会校验 `files` 中每个声明文件的 SHA-256，但不会解析或复制 `demo/` 内容。

演示模式写入 `mode: "demo"`、空的后端 `modules`/`adapters`/`bindings`、固定的 `viewModules` 列表，以及合并后演示数据的摘要。完整模式写入 `mode: "full"`；没有 `mode` 字段的旧生成记录仍按完整模式处理。皮肤记录不会保存远端 URL、本地绝对路径或下载令牌。

## 进一步阅读

- [公开仓库与项目介绍](https://github.com/evepupil/NextDevTpl)
- [生成器指南](https://github.com/evepupil/NextDevTpl/blob/master/src/content/docs/zh/generator.mdx)
- [皮肤制作指南](https://github.com/evepupil/NextDevTpl/blob/master/src/content/docs/zh/skin-authoring.mdx)
- [皮肤系统规则](https://github.com/evepupil/NextDevTpl/blob/master/docs/%E6%A8%A1%E5%9D%97%E8%AE%BE%E8%AE%A1/%E7%9A%AE%E8%82%A4%E7%B3%BB%E7%BB%9F.md)
- [升级指南](https://github.com/evepupil/NextDevTpl/blob/master/docs/%E5%8D%87%E7%BA%A7%E6%8C%87%E5%8D%97.md)

## 许可证

MIT
