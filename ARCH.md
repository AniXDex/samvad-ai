# Samvaad AI — Full Architecture (plain English)

This file is the complete map of the system: what each part does, how parts
talk, where data lives, and what happens when things go wrong. For the short
version, read `README.md`. For the build rules, read `MEMORY.md`.

## 1. Big picture

```
                ┌──────────────┐
                │   Officer    │  human, always the last word
                │   browser    │
                └──────┬───────┘
                       │ 1. upload ticket (metadata only)
                       ▼
┌──────────┐   ┌───────────────┐   ┌──────────────────┐
│ Next.js  │──▶│ Cloudflare R2 │──▶│  Inngest event   │  "a file arrived"
│ + tRPC   │   │  file storage │   │  upload/complete │
└────┬─────┘   └───────────────┘   └────────┬─────────┘
     │  login via                           │ 2. start job
     │  Neon Auth                           ▼
     │                             ┌──────────────────┐
     │                             │   Trigger.dev    │  long AI job:
     │                             │   durable job    │  read → structure →
     │                             └────────┬─────────┘  verify → draft
     │                                      │ 3. facts + draft
     │                                      ▼
     │                             ┌──────────────────┐
     │                             │  Neon Postgres   │  everything saved
     │                             │  + Qdrant later  │  + searchable later
     │                             └────────┬─────────┘
     │                                      │ 4. review
     │                                      ▼
                               ┌──────────────────────┐
                               │  Approval editor UI  │  officer edits,
                               │  sources + warnings  │  approves, publishes
                               └──────────────────────┘
```

Three ideas hold it together:
1. **Files never travel through the web server.** The browser uploads straight
   to storage with a short-lived ticket. The server only signs tickets.
2. **Nobody trusts one model.** OCR reads, Laya judges, word scans guard, the
   database remembers, the human decides.
3. **Everything is traceable.** Every sentence points to its source; every
   version, approver, model name, and confidence score is stored.

## 2. Layers and what each owns

**Browser + Next.js pages (`src/app`).** Screens and API routes. Pages are
thin: they call the tRPC API and show results. Long AI streams call Neon
Functions directly (never through a proxied route that could time out).

**tRPC API (`src/server`).** The only door to data. `health` is public.
`documents.create/list` need a signed-in user; bad input is rejected with
`BAD_REQUEST` before any database is touched; signed-out callers get `401`
(this is live-tested, not just believed). The router talks to a narrow
`DocumentsStore` port — unit tests use a memory store, production uses the
Drizzle store. Tenant enforcement via memberships + row-level security is the
next feat; until then tenants come from validated input and this gap is
written in SPEC 005, not hidden.

**Login (`src/lib/auth`, Neon Managed Better Auth).** Users and sessions live
in the `neon_auth` schema inside our own Postgres, so login data branches
with the database. The app checks the session on every protected call and
rejects direct unauthenticated requests, not just page visits.

**Files (`src/lib/r2`, Cloudflare R2).** Server-built keys
`tenants/{t}/docs/{d}/source.{ext}`. Only 9 file kinds allowed, each with an
exact file type; 500 MB cap; 5-minute upload tickets; post-upload type and
size verification. Quarantine bucket for rejects, lifecycle rules delete
unverified uploads. Settings (sizes, ticket life, allowed kinds) are module
options with reviewed defaults — operators change options, not code.

**Database (`src/lib/db`, Neon Postgres + Drizzle).** Tables today:
`documents` (id, tenant, title, status, timestamps) and `sources` (document
link with cascade delete, kind, R2 key, hash, metadata). Row types are
inferred from the schema — no hand-written copies to drift. Workflow rule:
`npm run db:push` on the persistent `dev` branch (no migration files in dev),
`db:generate` + `db:migrate` for production only. App traffic uses the pooled
URL; migrations use the direct URL (poolers break migrations — this bit us
nowhere because the rule predates the first migration).

**Fact engine (`src/lib/press-facts`).** Pure logic, no network. Claims in,
`PressNoteFacts` out: confirmed / unverified / not_stated / conflicting
(with both candidates kept). The draft renderer makes a fixed bundle —
3 headlines capped at 15 words, summary, inverted-pyramid detail — in English
(built in) plus a second language injected as a phrase dictionary, so the
codebase holds zero non-English words and translators never touch code.

**Fact checker (`src/lib/verify`, Laya Studio).** Yes/no questions against
source text over the Jev-compatible `/v1/systemone` wire. At most 32
questions per call; oversize text is rejected (caller trims
decisive-first), never silently cut. Returns probabilities; thresholds stay
with the caller because confidence must be calibrated per task. A fake
adapter serves tests; one live call proved the wiring.

**Events (Inngest) vs heavy jobs (Trigger.dev).** Inngest reacts fast:
file arrived, email sent, nightly checks. Trigger.dev carries the long,
crash-safe AI jobs with retries, per-tenant speed limits, and human-approval
waiting (`wait.forToken` — waiting escalates, never auto-approves). Rule:
over ~2 minutes, GPU, or human token → Trigger; events and crons → Inngest;
never the same job in both.

**Memory (mem0, queued).** Learns style and entities only from approved
notes — never from drafts or rejected text, so mistakes can't teach.

## 3. Data and where it lives

- **Postgres (source of truth):** tenants, users/sessions (managed schema),
  documents, sources, fact JSON, drafts, revisions (every edit: diff, who,
  why), approvals (who, when, checklist), append-only audit log.
- **R2 (files):** quarantine → verified → previews; originals immutable,
  served by short-lived signed links.
- **Qdrant (later, derived):** search index over chunks; rebuildable from
  Postgres at any time — never the primary copy.
- **Caches:** Upstash Redis for rate limits and live progress fan-out.

## 4. When things go wrong

- Bad file → quarantine + error, pipeline never starts on it.
- OCR/STT low confidence → page excluded from auto-citations, flagged for
  the officer, attached as image for manual reading.
- Sources disagree → `conflicting`, draft says "could not be confirmed",
  both options kept for the officer.
- Crime/casualty without citation → `not_stated`; publish blocked until a
  human confirms or leaves it unstated.
- Job crash → Trigger retries with backoff, then dead-letter queue + alert;
  page-level checkpoints resume instead of restarting.
- One tenant floods → per-tenant concurrency caps protect shared model
  budgets (the gateway key has a dollar budget — spend is watched).
- Secrets → `.env.local` + machine env only, both gitignored and verified;
 approver identity and model pins ship inside every audit bundle.

## 5. Security in one paragraph

Signed-in sessions on every protected call; tenant checks today, row-level
security next; upload tickets bound to type/size/expiry and verified after
upload; SVG and archives treated as hostile until proven safe; PII redacted
before any AI logging; append-only audit log; Swiss zero-retention inference
for the fact checker; no auto-publish path exists in code, only approval
tokens held by humans.

## 6. Decisions log (why, not just what)

- R2 over Neon buckets: user-owned storage already existed; Neon bucket stays
  declared but unused for uploads.
- Qdrant over pgvector: hybrid search + tenant filtering at growth; verdict
  from research, revisit under ~2M vectors.
- Drizzle over Prisma: skill-recommended default for new TypeScript schema
  work; pooled/direct split enforced in code.
- Managed Auth over self-hosted: no existing provider, org/RBAC built in.
- Laya over Jev: no Jev key exists; wire-compatible, 15% cheaper, Swiss
  hosting; Jev shadow-compare skipped for lack of a Jev key (stated openly).
- Gateway over direct OpenAI: operator-provided key + budget model.
- `db:push` in dev, migrations in prod: speed locally, safety in prod.
- Template drafts v1 over LLM prose: zero-invention guarantee today; LLM
  fluency plugs the same seam later.

## 7. Status and next

Proven live: R2 uploads, DB round-trips (scratch branch), tRPC + login HTTP,
Inngest dev loop, gateway inference, Mistral + Laya keys. Open: Sarvam first
real transcription, mem0 key re-check, Trigger.dev human login click,
memberships + RLS, approval editor UI, LLM claim extractor, Qdrant index.
Each maps to a spec file in `specs/` — build order follows the numbers.
