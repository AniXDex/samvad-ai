# SPEC 001 — R2 presigned ingest (Cloudflare R2 skill)

## Goal
Direct-to-R2 upload without proxying bytes through Next.js (host limits).

## Acceptance
- tRPC `r2.mint` takes metadata only {filename, mime, size, sha256, tenantId}; server authZ (Better-Auth session) + quota/type/size allowlist; builds key `tenants/{tenantId}/docs/{docId}/source.{ext}` server-side; returns PUT URL TTL ≤5 min with Content-Type+Length constraints (S3 SDK `PutObjectCommand` + `getSignedUrl`, region `auto`, endpoint per R2 config ref).
- Browser PUTs bytes direct to R2 (CORS allow app origin PUT/GET/HEAD only).
- tRPC `r2.complete` does HeadObject verify (size/magic-bytes via skill validation pattern), writes `sources` row (key, sha256, uploader), emits Inngest `upload.complete`.
- Keys/case: reject `..`, wrong MIME (client vs magic-byte mismatch → quarantine), oversize, unverified after 7d lifecycle delete.
- Test: mint→PUT→complete round-trip on test bucket; 401 without session; 413/400 on spoof/oversize; CORS preflight OK. (Needs R2 accountId + tokens — NOT in repo; obtain before implement.)
- Docs source: cloudflare skill references/r2/{configuration,patterns}.md (S3 SDK + presigned flow above).
