<p align="center">
  <br>
  <img src="public/logo.svg" alt="NextDevTpl" width="120">
  <br>
  <h1 align="center">NextDevTpl</h1>
  <p align="center">
    Generate an independently maintained Next.js SaaS app with a selected skin, features, and runtime mode.
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/create-nextdevtpl"><img src="https://img.shields.io/npm/v/create-nextdevtpl" alt="npm version"></a>
    <a href="https://github.com/evepupil/NextDevTpl/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT license"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" alt="TypeScript strict"></a>
    <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-10-orange?logo=pnpm" alt="pnpm 10"></a>
  </p>
</p>

[中文](README.md) | [English](README.en.md)

NextDevTpl 4.0.0 composes a skin, product features, and deployment target at generation time. The result is an independent source tree with no runtime dependency on the generator. Full mode keeps the selected product capabilities; demo mode uses the same views without a business backend.

## Quick Start

Node.js 24 and pnpm 10 are required.

Generate a full SaaS project:

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --preset saas --target vercel
cd my-app
```

Configure the retained services in the generated `.env.example`, then initialize the database and start the app:

```bash
pnpm db:push
pnpm dev
```

Generate a frontend demo project for local evaluation:

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-demo --mode demo --target server
cd my-demo
pnpm dev
```

The demo needs no business environment variables or database. Sign-in, profile edits, plan changes, and ticket actions update only the current tab's in-memory state. Refreshing or opening a new tab restores the default sample. Demo mode does not provide real authentication, payments, or business APIs.

## Full Mode

Omitting `--mode` is equivalent to `--mode full`. Full mode keeps the modules, service adapters, and deployment files selected by a preset or custom configuration.

| Preset | Main surface | Default target |
| --- | --- | --- |
| `minimal` | Authentication and basic workspace pages | `server` |
| `saas` | Marketing, auth, settings, subscriptions, credits, admin, and support | `vercel` |
| `ai-saas` | SaaS features with AI, blog, and PSEO | `cloudflare` |
| `custom` | Modules and services selected with flags | `server` |

Full mode supports `server`, `docker`, `vercel`, and `cloudflare`. Select payment, storage, mail, AI, jobs, rate limiting, analytics, and alerts with generator flags. The generator resolves module dependencies and records the effective selection in `nextdevtpl.generated.json`.

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app \
  --preset custom \
  --modules auth,analytics,operations \
  --target docker \
  --payment stripe \
  --analytics posthog
```

## Skins and Palettes

A skin is selected when the app is generated. Each output contains one skin and does not switch skins at runtime. `--skin` accepts the built-in default, a local directory, or an HTTPS archive with a trusted SHA-256 digest. Remote credentials come from an environment variable and are excluded from arguments, logs, generated projects, and the generated manifest.

```bash
pnpm dlx create-nextdevtpl@4.0.0 my-app --skin ./my-skin --preset saas
```

`--palette` is available only for the built-in default skin. The package includes an offline snapshot of 149 StyleKit themes. A selected theme adds its attribution and MIT license to the generated app. Palettes do not change page structure or add runtime network requests.

A skin must match the template and view API versions, declare view entries, dependencies, asset licenses, and file SHA-256 digests. Dynamic views must also meet demo mode's client compatibility requirements. Full projects that retain the docs feature can open the [generator guide](/en/docs/generator) and [skin authoring guide](/en/docs/skin-authoring).

## Demo Mode

Demo export retains 17 user-facing routes and 20 skin views, and supports only the `server` target. It rejects explicit `--preset`, `--modules`, and service-adapter options so the output cannot imply backend choices that are not present.

A skin may provide `demo/data.json` as a strictly validated data patch. It can define the sample user, plan ID and interval, credit ledger, billing history, and support tickets. Plan prices, monthly allowances, and feature entitlements still come from the template's shared plan catalog. Sample dates use a fixed UTC reference point rather than the runtime clock.

## Documentation

Full projects that include the docs feature expose built-in help at `/en/docs` and `/zh/docs`, including [Upgrade and Compatibility](/en/docs/upgrade).

Generated projects are independently maintained source trees. The generator does not overwrite them. Upgrade by comparing the original selection with a temporary project generated by the new version, then review and merge changes manually. Test database migrations outside production first.

## License

MIT
