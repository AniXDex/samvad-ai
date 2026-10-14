# Permanent Memory — samvaad-ai

Skills in force (read before implementing): `codebase-design` (+ DEEPENING.md:
dependency categories, seam discipline, replace-don't-layer) from
`.agents/skills/`; `neon`, `neon-postgres`, `neon-auth`, `neon-functions`,
`cloudflare` (R2 README/configuration/patterns) from the agent skills dir;
project skills `trigger-getting-started`, `inngest-setup` from
`.agents/skills/`. Neon docs + Cloudflare docs are source of truth; never
pre-trained numbers. Web research via Firecrawl first, fallback disclosed.

Code rules: strict TS + `noUncheckedIndexedAccess`; no `any` keyword, no
`ts-ignore`/`ts-expect-error` anywhere (grep-gated); no non-English literals
in `src` (locale packs inject at runtime through the `BundlePhrases` seam);
no hardcoded operator policy — sizes, TTLs, allowlists, lexicons, pool
ceilings, and word caps ship as named defaults behind module options;
dependencies injected at seams; tests live at module interfaces; one adapter
= hypothetical seam, two (real + fake) = real one.

Decisions: R2 for blobs (S3 presigned PUT, region auto, server-built keys);
Drizzle + `pg` (pooled app, direct migrate); DB rule: `db:push` in dev
(persistent `dev` branch, no migration files), `db:generate` + `db:migrate`
for prod only; Neon Managed Better Auth;
Trigger.dev = heavy durable jobs, Inngest = events/cron; Qdrant vectors;
mem0 later. Workflow: spec → implement → `typecheck` + `test` + `lint` +
`build` → commit → push (`main`, `Mayank-saraswal/samvad-ai`).

Blockers: Neon AI Gateway Free plan does not serve models (paid needed for
live LLM); Trigger.dev login is a human step (resumable flow per skill);
wrangler R2-admin needs an account token (the R2-scoped cfat token is S3-only).

## Compacted state (2026-10-14, feats 1–3 + 2 refactors shipped)
- Repo: D:\projects\samvaad-ai, remotes origin=samvad-ai (active), samvaad-ai=stale/invalid.
  Commits: 751aaa6 scaffold → b4e7c8b feat1 → f697d91 merge → 67d5b00 feat2 →
  28edf9d feat3+dbrule → 222b5e0 locale-seam → 699d279 policy-options.
- Feat 1: result/env/r2 modules, R2 live vs bucket `examgpt`, vitest, strict+noUncheckedIndexedAccess.
- Feat 2: db module (Drizzle+pg), migration generated, dev branch `dev`
  (br-dawn-math-az71zh8l) pushed via db:push + live round-trip; production never written.
- Feat 3: press-facts (facts/neutrality/bundle), template-v1 EN built-in + secondary
  locale injected (zero non-English literals in src).
- Refactors: locale seam; policy options (sizes/TTL/allowlist/lexicon/pool/cap).
- Gates green throughout: 32 passed + 2 live-skipped, lint/build/typecheck 0, any-grep 0.
- Secrets: .env.local + .neon gitignored (verified); R2 creds in User env + .env.local.
- Neon: linked samvaad-ai/production, Auth enabled, region aws-ap-southeast-1.
- Feat 4: tRPC (`createAppRouter(store)`, health public, documents protected,
  zod tenant/title/limit) + Managed Auth wiring (`config.ts` pure,
  `server.ts` thin leaf, `session.ts` mapping) + Drizzle store adapter.
  Live HTTP vs `next start`: health 200, `/api/auth/ok` 200, signed-out
  documents.list 401. Tenant-from-input gap → feat 5 (memberships + RLS).
- Still key-blocked: LLM/Jev/mem0 keys, Trigger.dev login. mem0 = write-after-approve only.
- Next (feat 5): memberships + tenant enforcement, then editor UI.
