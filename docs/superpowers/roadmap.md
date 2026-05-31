# Project Roadmap

## Product Goal

NextDevTpl is a production-ready Next.js SaaS starter template. It should let a
new SaaS project start from a working foundation that includes auth, billing,
credits, admin, support, docs, i18n, storage, observability, background jobs,
and AI integration points.

## Current Phase

Stabilization. The main product surface appears broadly implemented, and the
baseline build, typecheck, lint, and test commands now pass. The next priority
is deeper SaaS workflow verification and cleanup of the remaining warning-level
maintenance items.

## Milestones

| ID | Milestone | Goal | Status | Priority | Depends On | Evidence |
|----|-----------|------|--------|----------|------------|----------|
| M1 | Baseline health | Make `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test:run` reliable | done | high | None | All four commands passed on 2026-05-31 |
| M2 | SaaS core verification | Verify auth, billing, credits, support, admin, storage, and i18n workflows end to end | planned | high | M1 | Core modules and integration tests exist under `src/features` and `src/test` |
| M3 | Template onboarding | Keep setup docs, env docs, and deployment paths accurate for new projects | planned | medium | M1 | README and localized docs exist; README still describes Next.js 15 while package uses Next.js 16.1.4 |
| M4 | Product polish | Finish user-facing gaps such as buy credits flow and Next 16 compatibility cleanup | planned | medium | M1, M2 | `dashboard/credits/buy/page.tsx` is marked for future enablement; build warns that `middleware` should migrate to `proxy` |

## Active Work

- None.

## Next Recommended Steps

1. Verify SaaS core workflows end to end, especially auth, billing, credits, support, admin, storage, and i18n.
2. Decide whether to clean up the remaining Biome warning/info backlog or keep lint passing with warnings for now.
3. Choose between payment/credits flow completion, Next 16 compatibility cleanup, or onboarding documentation alignment.

## Inbox

| Item | Source | Status | Triage |
|------|--------|--------|--------|
| Create a lightweight project roadmap | User request on 2026-05-31 | active | Accepted |

## Backlog

| Item | Priority | Reason | Status |
|------|----------|--------|--------|
| Enable or remove the buy credits page placeholder | medium | A dashboard route is present but marked as future work | planned |
| Migrate deprecated `middleware` convention to `proxy` | medium | Next.js 16 build warns that `middleware` is deprecated | planned |
| Align README badges and docs with actual dependency versions | medium | README says Next.js 15 while `package.json` uses Next.js 16.1.4 | planned |
| Review lint warning policy for tests | low | Many warnings are from test non-null assertions; decide whether to fix or relax test rules | proposed |

## Risks and Unknowns

| Risk/Question | Impact | Status |
|---------------|--------|--------|
| `.next/dev/types/routes.d.ts` contains corrupted generated content | Could reappear if TypeScript reads dev cache directly | mitigated by excluding `.next/dev` from `tsconfig.json` |
| Biome lint still reports warning/info diagnostics | Does not fail `pnpm lint`, but may hide future maintenance work | planned |
| Tests warn that `DATABASE_URL` does not look like a test database | Could indicate tests are using a risky database target | active |
| Creem and optional service integrations need live-environment validation | Unit/integration tests cannot prove production webhook, storage, email, Redis, and observability configuration | planned |

## Decision Log

| Date | Decision | Reason | Evidence |
|------|----------|--------|----------|
| 2026-05-31 | Use `docs/superpowers/roadmap.md` as the project-level planning file | The project had no roadmap and the user asked to create one | Roadmap file created |
| 2026-05-31 | Prioritize health checks before new product scope | Build/typecheck/lint are not green, while tests pass | `pnpm test:run` passed; `pnpm build`, `pnpm typecheck`, and `pnpm lint` failed |
| 2026-05-31 | Exclude `.next/dev` from TypeScript project inputs | Next.js dev route types can be stale or corrupted while production `.next/types` remains valid | `pnpm build` and `pnpm typecheck` passed after the change |

## Recent Progress

- 2026-05-31: Confirmed git worktree was clean on `master...origin/master`.
- 2026-05-31: Ran `pnpm test:run`; all 15 test files and 274 tests passed.
- 2026-05-31: Ran `pnpm build`; production compile succeeded, then TypeScript failed on corrupted `.next/dev/types/routes.d.ts`.
- 2026-05-31: Ran `pnpm typecheck`; failed on the same generated `.next/dev/types/routes.d.ts` syntax issue.
- 2026-05-31: Ran `pnpm lint`; Biome reported 19 errors, 208 warnings, and 9 infos.
- 2026-05-31: Excluded `.next/dev` from `tsconfig.json`, fixed the Biome error set, and verified `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test:run` all pass.
