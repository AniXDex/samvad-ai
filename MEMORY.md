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
