# create-nextdevtpl

[中文](README.md) | [English](README.en.md)

Generate a standalone Next.js SaaS application from an official NextDevTpl
preset or a custom module and service selection. Generated projects own their
source code and do not depend on this package at runtime. The 3.x operations
module adds typed telemetry, an admin metrics dashboard, AI cost read models,
daily snapshots, and safe email or signed-webhook alerts.

Node.js 24 and pnpm are required.

## Quick start

```bash
pnpm dlx create-nextdevtpl@2.6.0 my-app --preset saas --target vercel
```

## Presets and targets

- Presets: `minimal`, `saas`, `ai-saas`, and `custom`
- Targets: `server`, `docker`, `vercel`, and `cloudflare`
- Services: payment, storage, mail, AI, alerts, analytics, jobs, and rate limiting

The main service flags are `--payment`, `--storage`, `--mail`, `--ai`,
`--alerts`, `--analytics`, `--jobs`, and `--rate-limit`. Run `--help` for the
accepted value list. `--alerts` is meaningful when `operations` is selected.

The current CLI uses flags. Omitting `--preset` creates `minimal` for the
`server` target. Use `custom` when selecting modules or overriding services.

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

For the operations kit, include `operations` in `--modules`. It brings the
admin and payment dependencies automatically; the generated manifest and
`.env.example` show the exact retained files and variables.

The operations module exposes `/admin/operations`,
`/api/jobs/operations/snapshot`, and `/api/jobs/operations/alerts`. Schedule
the protected cron endpoints with your deployment platform and treat missing
analytics data as an explicit status, not as zero activity.

The generator resolves module dependencies, removes unselected source and
packages, creates a selection-specific `.env.example`, and writes
`nextdevtpl.generated.json`. Keep that manifest for later upgrade comparisons.

```bash
pnpm dlx create-nextdevtpl@2.6.0 --help
```

Documentation and source are available in the
[NextDevTpl repository](https://github.com/evepupil/NextDevTpl).
