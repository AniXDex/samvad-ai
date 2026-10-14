# SPEC 004 — Postgres module ✅ implemented (feat 2)

Module `src/lib/db` (`schema.ts` + `db.ts`). Tables `documents`
(id/tenant_id/title/status/timestamps) and `sources`
(document_id FK cascade, kind, r2_key, sha256, metadata jsonb, created_at);
row types inferred (`$inferSelect/$inferInsert`), no manual DTOs.

Connection seam: `pickConnectionString({pooled, direct}, "app" | "migrate")`
→ pooled `DATABASE_URL` for app traffic, direct `DATABASE_URL_UNPOOLED` for
migrations (blank/missing fail with the variable name). `createDb(string)` builds
a `pg` pool (max 5) + Drizzle; connection string injected, `process.env` never
read inside. `drizzle.config.ts` points at `./drizzle` with the direct URL;
migration `drizzle/0000_true_blizzard.sql` generated (2 tables, 1 FK).

Proof (skill-blessed branch flow): ephemeral branch `feat2-verify` created →
`drizzle-kit migrate` applied there (exit 0) → guarded live suite
insert/select/delete round-trip passed → branch deleted. Production was never
written. Next: `documents`/`sources` route handlers + RLS policies.
