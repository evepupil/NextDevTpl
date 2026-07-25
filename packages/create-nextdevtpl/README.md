# create-nextdevtpl

Generate a standalone Next.js SaaS application from an official NextDevTpl
preset or a custom module and service selection. Generated projects own their
source code and do not depend on this package at runtime.

Node.js 24 and pnpm are required.

## Quick start

```bash
pnpm dlx create-nextdevtpl@2.6.0 my-app --preset saas --target vercel
```

## Presets and targets

- Presets: `minimal`, `saas`, `ai-saas`, and `custom`
- Targets: `server`, `docker`, `vercel`, and `cloudflare`
- Services: payment, storage, mail, AI, jobs, and rate limiting

The current CLI uses flags. Omitting `--preset` creates `minimal` for the
`server` target. Use `custom` when selecting modules or overriding services.

```bash
pnpm dlx create-nextdevtpl@2.6.0 my-app \
  --preset custom \
  --modules auth,dashboard,marketing,blog \
  --target docker \
  --payment stripe \
  --mail smtp \
  --rate-limit noop
```

The generator resolves module dependencies, removes unselected source and
packages, creates a selection-specific `.env.example`, and writes
`nextdevtpl.generated.json`. Keep that manifest for later upgrade comparisons.

```bash
pnpm dlx create-nextdevtpl@2.6.0 --help
```

Documentation and source are available in the
[NextDevTpl repository](https://github.com/evepupil/NextDevTpl).
