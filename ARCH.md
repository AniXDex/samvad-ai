# samvaad-ai — Architecture (SKIT005: AI Press Note + Official Communication Assistant)

Deep-module layout (`codebase-design` skill vocabulary): each module exposes one
small interface at its seam; tests cross the same seam as callers.

## Modules (planned → ✅ built)
- ✅ `src/lib/result` — `Result<T,E>` kernel (in-process). Interface: `ok/err/isOk/isErr/map/andThen`.
- ✅ `src/lib/env` — typed env loading. Interface: `loadEnv(source)` → `Result<Env, EnvIssue[]>`; never reads `process.env` itself.
- ✅ `src/lib/r2` — object-storage seam (true-external: Cloudflare R2 over S3).
  Interface: `createUploadGrant` + `headObject`; keys built inside
  (`tenants/{t}/docs/{d}/source.{ext}`); failures as `R2Failure` union, never throws.
  Adapters (internal seam): `adapters/s3.ts` (production), `adapters/memory.ts` (tests).
- ✅ `src/lib/db` — Postgres seam: `pickConnectionString` (pooled app / direct
  migrate) + `createDb` (injected string, pg max 5) + Drizzle schema
  (`documents`, `sources`); migration `drizzle/0000_true_blizzard.sql`.
- ✅ `src/lib/press-facts` — `structureFacts` (confirmed/unverified/not_stated/
  conflicting rules) + `checkNeutrality` pre-check + `buildDraftBundle`
  (EN+HI template-v1, headline cap, unconfirmed clauses); LLM extractor, Jev
  port adapter, and fluency renderer plug in later behind the same seams.
- `src/app/editor` — shadcn approval UI (components via `npx shadcn add`). Next feat.

## Services
Next.js 16.4 App Router (Node runtime for APIs) + Neon Postgres/Auth (Managed
Better Auth via `@neondatabase/auth`; `auth:true` to be declared in `neon.ts`)
+ Cloudflare R2 presigned uploads + Qdrant vectors + Trigger.dev heavy jobs +
Inngest events + mem0 memory (keys later; write only after human approve).

## Invariants
VLM may interpret, never attest. Crime/casualty fields are `null + not_stated`
unless cited. No publish without a human approval token; timeouts escalate.
Audit proves provenance, not truth. Secrets live in `.env.local` (gitignored)
and User env only — never in the repo.
