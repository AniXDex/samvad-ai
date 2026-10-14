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
  28edf9d feat3+dbrule → 222b5e0 locale-seam → 699d279 policy-options →
  e7d874e feat4-api → 0ec4308 feat5-keys → ee5ec2e mem0-record.
- Feat 1: result/env/r2 modules, R2 live vs bucket `examgpt`, vitest, strict+noUncheckedIndexedAccess.
- Feat 2: db module (Drizzle+pg), migration generated, dev branch `dev`
  (br-dawn-math-az71zh8l) pushed via db:push + live round-trip; production never written.
- Feat 3: press-facts (facts/neutrality/bundle), template-v1 EN built-in + secondary
  locale injected (zero non-English literals in src).
- Refactors: locale seam; policy options (sizes/TTL/allowlist/lexicon/pool/cap).
- Feat 4: tRPC + Managed Auth (live HTTP: health/auth-ok 200, signed-out 401).
- Gates green throughout: 43 passed + 3 live-skipped, lint/build/typecheck 0, any-grep 0.
- Secrets: .env.local + .neon gitignored (verified); R2 creds in User env + .env.local.
- Neon: linked samvaad-ai/production, Auth enabled, region aws-ap-southeast-1.
- Feat 5: AI keys stored (`MISTRAL_API_KEY`, `LITELLM_*` gateway per
  docs.corsair.dev/llm-gateway, `SARVAM_API_KEY`, `MEM0_API_KEY`); gateway verified
  (models list + 15-token nano smoke 200; `/key/info` 500s server-side —
  their LiteLLM schema drift, reported honestly); Mistral key verified via
  models list; Sarvam unverified until first STT run. mem0 key REJECTED
  (401 `token_not_valid` on read-only list — needs re-check in mem0
  dashboard, value kept as-supplied, never assumed valid). Inngest dev loop live
  (`/api/inngest` 200 dev mode, 1 function). Trigger.dev CLI 4.7.3 cached,
  resumable login started — user must open the authorization URL, then
  `trigger.config.ts` (needs dashboard project ref) + `TRIGGER_SECRET_KEY`.
- Still key-blocked: Sarvam unverified until first STT run; Trigger project ref +
  secret (after user login); mem0 second key also 401 — pasted value hid a
  U+200B zero-width space (found, stripped, re-verified, still `token_not_valid`;
  dashboard re-check needed, value kept as-supplied).
- Feat 6: Laya migration (no Jev key) — `LAYA_API_KEY` stored + verified
  (`/v1/usage` 200, 6000 free credits); `src/lib/verify` port (HTTP + fake
  adapters, ≤32/state-budget guards, thresholds with callers); one live Noul
  passed (micro-spend, shape-only assertions). SPEC 002's verifier refs now
  mean this module.
- Next: editor UI, then Trigger config after login.
