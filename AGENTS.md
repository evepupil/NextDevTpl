# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

NextDevTpl is a composable, production-ready Next.js SaaS template. `create-nextdevtpl` generates a standalone project from selected product modules, service adapters, and a deployment target. Unselected source, dependencies, environment variables, database schema, and deployment files are removed.

**Deployment:** Server, Docker Compose, Vercel, or Cloudflare Workers

## Commands

```bash
pnpm dev              # Dev server (Turbopack)
pnpm build            # Production build
pnpm lint             # Biome lint
pnpm format           # Biome format
pnpm check            # Biome check + autofix
pnpm typecheck        # tsc --noEmit
pnpm db:push          # Push Drizzle schema to database
pnpm db:generate      # Generate Drizzle migrations
pnpm db:studio        # Open Drizzle Studio GUI
pnpm test             # Vitest (watch mode)
pnpm test:run         # Vitest (single run)
pnpm test:run -- src/test/path/to/file.test.ts  # Run single test file
```

Tests live in `src/test/` (not colocated), run sequentially to avoid DB race conditions, with 30s timeout for integration tests. Test env vars loaded from `.env.test`.

## Tech Stack

- **Framework:** Next.js 16 (App Router only, no `pages/`), React 19, TypeScript (strict, no `any`)
- **Styling:** Tailwind CSS 4, Shadcn/UI, Radix UI, Framer Motion
- **Database:** PostgreSQL (Neon) via Drizzle ORM (edge compatible)
- **Auth:** Better Auth (email/password + Google + GitHub OAuth)
- **Validation:** Zod, React Hook Form, next-safe-action
- **Async Processing:** Inngest or Cloudflare Workflows through a shared jobs contract
- **AI:** OpenAI Compatible (OpenAI / DeepSeek / MiMo), Anthropic, or Workers AI; optional Cloudflare AI Gateway
- **Storage:** S3 Compatible or a native Cloudflare R2 Binding
- **Payment:** Creem or Stripe through a shared payment contract
- **Mail:** Disabled, Resend, SMTP, or Cloudflare Email
- **Rate Limiting:** No-op, Upstash Redis, or Cloudflare Rate Limiting bindings
- **Logging:** Pino + optional Axiom cloud logging
- **Monitoring:** Optional Sentry integration
- **i18n:** next-intl (locales: `en`, `zh`)
- **Content:** Fumadocs MDX (docs, blog, legal pages)
- **Linting:** Biome (replaces ESLint + Prettier)
- **Package Manager:** pnpm
- **Testing:** Vitest

## Architecture

### Composition Layers

- `src/core/modules/` — stable module contract and validation
- `src/modules/` — registry containing only modules selected for the generated project
- `src/core/services/` — provider-neutral payment, storage, mail, AI, jobs, and rate-limit contracts
- `src/adapters/` — selected provider implementations and runtime bindings
- `src/services/` — business-facing service instances; feature code imports these instead of provider SDKs
- `recipes/catalog.json` — source of truth for modules, adapters, presets, environment variables, and runtime constraints
- `nextdevtpl.generated.json` — generated-project record of the effective selection

### Route Groups (`src/app/[locale]/`)

All routes are under `[locale]` for i18n:

- **`(marketing)/`** — Public pages (home, pricing, blog, legal). Layout: Header + Footer.
- **`(dashboard)/`** — Authenticated area (dashboard overview, credits, settings, support). Layout: Sidebar + Topbar. Requires session token in middleware.
- **`(auth)/`** — Sign-in, sign-up, forgot/reset password. Redirects to dashboard if already logged in.
- **`(admin)/`** — Admin panel (users, tickets, stats). Requires admin role.

### API Routes (`src/app/api/`)

- `inngest/route.ts` — present only with the Inngest adapter
- `upload/presigned/route.ts` — Presigned S3/R2 upload URLs
- `webhooks/payment/route.ts` — shared Creem/Stripe payment webhook
- `auth/[...all]/route.ts` — Better Auth catch-all
- `search/route.ts` — Search API
- `jobs/credits/expire/route.ts` — Credits expiration cron

### Feature Modules (`src/features/`)

Each feature is self-contained:
```
src/features/[name]/
├── components/   # UI components
├── actions/      # Server Actions ("use server")
├── hooks/        # Custom React hooks
├── types/        # TypeScript types
└── index.ts      # Public exports
```

Key modules: `credits/`, `payment/`, `subscription/`, `storage/`, `marketing/`, `dashboard/`, `admin/`, `auth/`, `support/`, `settings/`, `mail/`, `shared/`, `blog/`, `analytics/`

### Async Processing

Product code calls `jobService`. The selected implementation lives under `src/adapters/jobs/`: Inngest for conventional runtimes or Cloudflare Workflows for Workers. Protected cron handlers remain under `src/app/api/jobs/`.

### Server Action Tiers (`src/lib/safe-action.ts`)

Three `next-safe-action` client levels:
- **`actionClient`** — Base with logging middleware
- **`protectedAction`** — Adds auth check, provides `ctx.user` and `ctx.userId`
- **`adminAction`** — Adds admin role check on top of protected

Pattern for defining actions:
```typescript
const withFeatureAction = (name: string) =>
  protectedAction.metadata({ action: `feature.${name}` });

export const myAction = withFeatureAction("myAction")
  .schema(zodSchema)
  .action(async ({ parsedInput, ctx }) => { /* ... */ });
```

### Credits System (`src/features/credits/`)

Double-entry bookkeeping with FIFO batch expiration:
- Every credit movement creates a transaction with debit/credit accounts
- `grantCredits()` — Creates batch + transaction + updates balance
- `consumeCredits()` — FIFO consumption (earliest-expiring batch first)

### Subscription Plans (`src/config/subscription-plan.ts`)

4 tiers (Free, Starter, Pro, Ultra) with per-plan limits on file size, queue priority, and monthly credits. `getUserPlan()` maps the selected payment provider's normalized product ID to a plan.

### Database Schema (`src/db/schema/`)

Uses Drizzle ORM with typed enums. Schema is split into `auth`, `credits`, `subscription`, `support`, and `mail` groups. The generator exports only groups required by selected modules.

All tables use `text` primary keys with `nanoid()` defaults.

### Middleware (`src/middleware.ts`)

Handles three concerns in order:
1. **API rate limiting** — Pattern-matched per-route (auth, upload)
2. **Auth protection** — `/dashboard/**` requires session token cookie, auth routes redirect if logged in
3. **i18n routing** — next-intl locale prefix handling

### AI Provider Abstraction (`src/services/ai.ts`)

The shared `aiService` supports OpenAI Compatible, Anthropic, and Workers AI adapters. OpenAI Compatible can switch between OpenAI, DeepSeek, and MiMo through `AI_PROVIDER`, with optional Cloudflare AI Gateway proxying.

## Coding Conventions

- **Language:** Chinese comments throughout the codebase (code itself in English)
- **Path alias:** `@/*` maps to `src/*`
- **Formatting:** Biome — double quotes, semicolons, trailing commas (ES5), 2-space indent, 80 char line width
- **Lint rules:** `noExplicitAny: error`, `noUnusedImports: error`, `noUnusedVariables: error`, `useImportType: error`
- **Server Components by default** — only add `'use client'` when interactivity is needed
- **Data fetching in RSC** — Server Components call Drizzle directly; mutations use Server Actions
- **i18n navigation** — Import `Link`, `redirect`, `usePathname`, `useRouter` from `@/i18n/routing` (not `next/link` or `next/navigation`)
- **API route wrapping** — Use `withApiLogging(handler)` from `@/lib/api-logger.ts`
- **Optional services degrade gracefully** — Rate limiting, Axiom logging, Sentry monitoring all check env vars and silently skip when unconfigured

## Environment Variables

See the generated `.env.example` for the exact list. A basic authenticated app needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `NEXT_PUBLIC_APP_URL`. Provider variables are required only when their adapter is selected. Worker bindings are configured in `wrangler.jsonc` and secrets through Wrangler or the platform secret manager.
