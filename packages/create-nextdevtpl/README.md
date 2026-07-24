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

Use non-interactive flags in CI or run the command without a preset for the
guided flow.

```bash
pnpm dlx create-nextdevtpl@2.6.0 --help
```

Documentation and source are available in the
[NextDevTpl repository](https://github.com/evepupil/NextDevTpl).
