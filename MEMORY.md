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

## Compacted state (Current — everything below is verified truth)
- Repo: D:\projects\samvaad-ai; origin=samvad-ai (active, main tracks it);
  samvaad-ai remote stale/invalid (kept, never pushed).
- Key milestones completed & pushed to main:
  - Clerk auth migration (`src/proxy.ts`, catch-all routes, UI themes, homepage).
  - Trigger.dev setup (`trigger.config.ts`, smokeCheck, extractPressFacts, transcribeAudioBriefing, pressNoteApprovalPipeline with waitpoint tokens).
  - Sarvam STT deep module (`src/lib/stt/sarvam.ts`) — saaras:v4 codemix Hinglish, live probe verified against api.sarvam.ai.
  - Officer Review Dossier workspace (`src/app/dossiers/[id]/page.tsx`, `review-editor.tsx`, `actions.ts`).
  - Tenant membership & RBAC (SPEC 005 gap closed: `memberships` table in Drizzle, approver/contributor/auditor role enforcement in tRPC & Server Actions).
  - Mistral OCR & Vision deep module (SPEC 008: `src/lib/ocr/mistral.ts`, `src/trigger/ocr-document.ts`).
  - Qdrant Vector Search & Precedent Retrieval (SPEC 009: `src/lib/vector/qdrant.ts`, `precedents.search` tRPC router).
- Specs: 001–009 in `specs/`, all implemented and verified.
- Gates: 69 passed + 4 live-skipped, typecheck 0, lint 0, build 0, any-grep 0,
  Devanagari-grep 0 in `src/`.
- Key ledger — GOOD: Clerk keys, Neon OAuth, R2 set, cookie secret, Mistral, gateway,
  Laya, Sarvam API key (proven live 459ms), Trigger.dev dev token.

