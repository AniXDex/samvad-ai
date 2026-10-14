# SPEC 001 — R2 presigned ingest ✅ implemented (feat 1)

Module `src/lib/r2` (`r2.ts` + `adapters/s3.ts` + `adapters/memory.ts`).
Keys server-built; allowlist pdf/png/jpg/jpeg/webp/mp3/wav/m4a/ogg with exact
MIME match; 1 B–500 MiB; ids `[A-Za-z0-9_-]{1,64}` (traversal impossible);
TTL 300 s. Failures: `invalid-input | forbidden | not-found | transport`.

Tests: `r2.test.ts` (grant shape/expiry, allowlist gate with zero network
calls, MIME+size aggregation, traversal ids, head round-trip/missing) through
the module interface via the memory adapter. `r2.live.test.ts` is
read-only against the real `examgpt` bucket and skips without creds.
Next: tRPC `r2.mint`/`r2.complete` route handlers calling this module.
