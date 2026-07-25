<p align="center">
  <br>
  <img src="public/logo.svg" alt="NextDevTpl" width="120">
  <br>
  <h1 align="center">NextDevTpl</h1>
  <p align="center">
    A composable, production-ready Next.js SaaS starter.
  </p>
  <p align="center">
    <a href="https://www.npmjs.com/package/create-nextdevtpl"><img src="https://img.shields.io/npm/v/create-nextdevtpl" alt="npm version"></a>
    <a href="https://github.com/evepupil/NextDevTpl/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT license"></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript" alt="TypeScript strict"></a>
    <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-10-orange?logo=pnpm" alt="pnpm 10"></a>
  </p>
</p>

NextDevTpl 2.x creates a standalone application containing only the modules,
service adapters, dependencies, environment variables, database schema, and
deployment files you select. Generated source belongs to your project and has
no runtime dependency on the generator.

## Create an app

Node.js 24 and pnpm 10 are required.

```bash
pnpm dlx create-nextdevtpl@latest my-app --preset saas --target vercel
cd my-app
Copy-Item .env.example .env.local # Windows PowerShell
pnpm db:push
pnpm dev
```

On macOS or Linux, use `cp .env.example .env.local`.

Omitting `--preset` creates the `minimal` preset. The current CLI is driven by
flags, so use `--help` to inspect every option:

```bash
pnpm dlx create-nextdevtpl@latest --help
```

## Presets

| Preset | Included product surface | Default services | Default target |
| --- | --- | --- | --- |
| `minimal` | Auth and dashboard | Disabled mail, no-op rate limit | Server |
| `saas` | Marketing, auth, dashboard, settings, admin, support, subscriptions, credits | Creem, S3-compatible storage, Resend, Inngest, Upstash | Vercel |
| `ai-saas` | Full SaaS surface plus analytics, blog and PSEO | Stripe, R2 binding, Cloudflare Email, Workers AI, Workflows, Cloudflare rate limits | Cloudflare Workers |
| `custom` | Modules and adapters supplied with flags | Disabled mail and no-op rate limit | Server |

Dependencies between modules are included automatically. For example,
`support` also brings in credits, payments, subscriptions, mail, auth, shared
UI, and the required database schema.

```bash
pnpm dlx create-nextdevtpl@latest my-app \
  --preset custom \
  --modules auth,dashboard,marketing,blog \
  --target docker \
  --payment stripe \
  --mail smtp \
  --rate-limit noop
```

After generation, `nextdevtpl.generated.json` is the source of truth for the
selected preset, modules, adapters, and deployment target.

## Included capabilities

| Area | Capabilities |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, Tailwind CSS 4, Shadcn/UI, strict TypeScript |
| Authentication | Better Auth email/password, GitHub and Google OAuth, sessions, user/admin roles |
| Database | PostgreSQL, Drizzle ORM, split schema groups, migrations and integration tests |
| Payments | Shared payment contract with Creem and Stripe adapters, subscriptions, one-time purchases and verified webhooks |
| Credits | Double-entry ledger, FIFO consumption, batch expiry and idempotent subscription grants |
| Mail | Shared mail contract with disabled, Resend, SMTP and Cloudflare Email adapters |
| Storage | S3-compatible presigned uploads or a native Cloudflare R2 binding |
| AI | OpenAI-compatible providers, Anthropic and Workers AI behind one service interface |
| Jobs | Inngest or Cloudflare Workflows behind one job interface, plus protected cron endpoints |
| Rate limiting | Upstash Redis, Cloudflare Rate Limiting bindings, or a no-op local adapter |
| Product UI | Localized marketing site, docs, blog, PSEO, dashboard, settings, admin and support tickets |
| Operations | Health checks, structured logs, optional Axiom and Sentry, compatibility matrix and deployment smoke checks |

## Service adapters

Choose one adapter per service during generation. Worker-only adapters require
the `cloudflare` target; Node-only adapters cannot be used on that target.

| Service | Available adapters |
| --- | --- |
| Payment | `creem`, `stripe`, `none` |
| Storage | `s3-compatible`, `r2-binding`, `none` |
| Mail | `disabled`, `resend`, `smtp`, `cloudflare-email` |
| AI | `openai-compatible`, `anthropic`, `workers-ai`, `none` |
| Jobs | `inngest`, `cloudflare-workflows`, `none` |
| Rate limit | `noop`, `upstash`, `cloudflare-rate-limit` |

Business code imports stable services from `src/services`. Provider-specific
SDKs and bindings stay under `src/adapters`, which keeps later replacements
small and reviewable.

## Deployment targets

| Target | Generated deployment files | Build or launch command |
| --- | --- | --- |
| `server` | Standalone Next.js build, systemd example, server build/start scripts | `pnpm deploy:server:build` |
| `docker` | Multi-stage `Dockerfile`, Compose app, migration and PostgreSQL services | `docker compose --env-file .env.production up -d --build` |
| `vercel` | `vercel.json`, health endpoint and optional cron configuration | Vercel Git deployment or CLI |
| `cloudflare` | OpenNext config, Worker entry, Wrangler bindings and Worker-safe replacements | `pnpm cf:build` / `pnpm cf:deploy` |

Every target exposes `/api/health`. Run a post-deployment check with:

```bash
pnpm deploy:check -- https://your-domain.example/api/health
```

## Project layout

```text
src/
├── app/                 # Localized App Router pages and API handlers
├── core/modules/        # Module contract and validation
├── core/services/       # Provider-neutral service contracts
├── modules/             # Registry generated from selected modules
├── adapters/            # Selected provider implementations
├── services/            # Business-facing service instances
├── features/            # Auth, payments, credits, support, marketing, etc.
├── db/schema/           # Schema groups selected by the generator
└── content/docs/        # Built-in English and Chinese user documentation

recipes/catalog.json                 # Modules, adapters and presets
packages/create-nextdevtpl/          # Published project generator
nextdevtpl.generated.json            # Selection recorded in a generated app
tests/compatibility/                  # Supported combination matrix
deploy/                              # Target-specific deployment guides
```

## Documentation

Generated `saas` and `ai-saas` projects include documentation at `/en/docs`
and `/zh/docs`. The source pages in this repository cover:

- [Quick start](src/content/docs/en/quick-start.mdx)
- [Generator and presets](src/content/docs/en/generator.mdx)
- [Feature modules](src/content/docs/en/feature-modules.mdx)
- [Service adapters](src/content/docs/en/service-adapters.mdx)
- [Configuration](src/content/docs/en/configuration.mdx)
- [Deployment](src/content/docs/en/deployment.mdx)
- [Upgrade and compatibility](src/content/docs/en/upgrade.mdx)

Chinese pages live beside them under `src/content/docs/zh`.

## Working on the template repository

Clone the source repository when contributing to NextDevTpl itself:

```bash
git clone git@github.com:evepupil/NextDevTpl.git
cd NextDevTpl
pnpm install
Copy-Item .env.example .env.local
pnpm db:push
pnpm dev
```

Quality gates:

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

## Upgrade model

Generated projects are independently owned source trees. NextDevTpl 2.x does
not overwrite them. To upgrade, generate a temporary comparison project with
the same `nextdevtpl.generated.json` selection, review the diff, merge changes
in small groups, run migrations in a test database, and pass the full quality
gate before production.

See [the upgrade guide](docs/升级指南.md) and
[compatibility troubleshooting](docs/兼容性故障排查.md).

## License

MIT
