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

## Compacted state (2026-10-14 EOD — everything below is current truth)
- Repo: D:\projects\samvaad-ai; origin=samvad-ai (active, main tracks it);
  samvaad-ai remote stale/invalid (kept, never pushed).
  Commits: 751aaa6 scaffold → b4e7c8b feat1 → f697d91 merge → 67d5b00 feat2 →
  28edf9d feat3+dbrule → 222b5e0 locale-seam → 699d279 policy-options →
  e7d874e feat4-api → 0ec4308 feat5-keys → ee5ec2e mem0-record →
  48ff592 feat6-laya → 58e31b7 mem0-401 → 531e6b6 docs → 272724f arch-example.
- Modules (all deep, tested at interface): result, env, r2 (+s3/memory adapters),
  db (Drizzle schema documents/sources), press-facts (facts/neutrality/bundle),
  verify (Laya port + fake), auth (config pure / server thin leaf), trpc
  (router+store port+drizzle adapter), inngest (client+1 function), trpc client.
- Specs 001–007 in specs/; README (plain-English) + ARCH (full + Hinglish §8).
- Gates: 43 passed + 3 live-skipped, typecheck/lint/build 0, any-grep 0,
  Devanagari-grep 0. Live proofs: R2 vs `examgpt`, DB round-trip on scratch
  branch (deleted), tRPC/auth HTTP (health+auth-ok 200, signed-out 401),
  Inngest dev 200 (1 fn), gateway nano smoke 200, Mistral models 200,
  Laya Noul passed, Laya usage 200 (6000 free).
- Secrets: .env.local + .neon gitignored (check-ignore verified); R2 + cookie
  secret in User env too; AI/Laya/mem0 keys in .env.local only.
- Neon: samvaad-ai/production (br-super-dream), Auth on, aws-ap-southeast-1;
  persistent `dev` branch (br-dawn-math) for db:push. Production never written
  except intended links. Neon AI Gateway: Free = no serving (use direct keys).
- Key ledger — GOOD: Neon OAuth, R2 set, cookie secret, Mistral, gateway,
  Laya. BAD: mem0 2×401 (2nd hid U+200B, stripped, still invalid — dashboard
  re-check needed). UNPROVEN: Sarvam (first STT run). HUMAN-GATED: Trigger.dev
  login URL opened? unknown — project ref + TRIGGER_SECRET_KEY still needed.
- Tooling notes: shell strips `$vars` (write probe .js files instead, delete
  after); no head/tail on Windows; quote `@scope` npm args; wrangler needs
  account token (cfat is S3-only); inngest 4.23 = 2-arg createFunction (skill
  shows stale 3-arg); gateway /key/info 500s (their schema drift).
- Vulns: 21 (9→12 high) from inngest+trigger transitive deps; no --force.
- Next in order: (1) Trigger login resume + config + first task, (2) memberships
  + RLS (tenant-from-input gap, SPEC 005), (3) editor UI via shadcn CLI,
  (4) LLM claim extractor, (5) Sarvam first run + mem0 valid key + Qdrant.
