# samvaad-ai — Architecture (SKIT005: AI Press Note + Official Communication Assistant)

## 1. System overview
Upload messy sources (FIR/event PDF, scene photo, audio briefing via Cloudflare R2 presigned URLs, or structured form) → Inngest `upload.complete` validation → Trigger.dev durable job (Mistral OCR / Sarvam+OpenAI STT → verbatim store → PII redact → PressNoteFacts JSON temp-0 with citations → mem0 style recall → Jev Noul verify → neutrality gate → EN+HI draft bundle) → human edit/approve (`wait.forToken`, shadcn editor, citation view) → versioned publish + audit bundle. Postgres = source of truth; Qdrant = derived search index (rebuildable); mem0 = style/entity memory (write only after approve).

## 2. Services
| Layer | Choice | Notes |
|---|---|---|
| App host | Next.js 16 (Vercel/similar) | Node runtime for tRPC/S3-sign/R2-sign; Edge only for proxy.ts |
| API | tRPC v11 + TanStack Query v5 | mint/complete, jobs.enqueue/getStatus, SSE `onProgress` for long jobs |
| UI | shadcn/ui + Tailwind | Add ONLY via `npx shadcn@latest add <comp>`; editor shows sources+cites+flags |
| Auth | Neon Managed Better Auth (`auth:true`) | `@neondatabase/auth` wrapper; roles contributor/approver/auditor; trusted domains per env |
| DB | Neon Lakebase Postgres + Drizzle + `pg` | Pooled URL app, direct URL migrations; RLS `FORCE RLS` + `WHERE tenant` defense-in-depth |
| Vectors | Qdrant Cloud | `group_id is_tenant:true` + server-side filter; collections rebuildable from `chunks` |
| Blobs | Cloudflare R2 | `tenants/{id}/docs/{docId}/source.*`, server-built keys, 5-min presigned PUT, HeadObject verify, quarantine→verified lifecycle |
| Heavy jobs | Trigger.dev v4 | OCR/STT/structure/draft, per-tenant concurrency, idempotency `hash+page+modelPin`, DLQ, checkpoint resume |
| Events | Inngest | upload.complete fan-out, email/SSE, cron PG↔Qdrant reconciler |
| Long streams | Neon Function `hello` (+ future `agent` fn) | Hono, pg pool module-scope max 5 + `attachDatabasePool`, JWT verify (JWKS), client-direct for streams |
| LLM | Mistral OCR 4.1 pinned + OpenAI gpt-transcribe/mini + Sarvam saaras:v4 + Jev pinned | Verbatim-copy prompts temp 0, `source_box/segment_id` required per field, dual-pass numbers |
| Observe | Langfuse (LLM) + Sentry (errors) + `neon logs query` | Trace ingest→publish with tenant/request/run ids, never raw PII |
| Research | Firecrawl MCP (`firecrawl_search/scrape/parse`) | opencode.json remote; fallback websearch disclosed |

## 3. Data model (Postgres)
`tenants, users(session via neon_auth), memberships, documents, sources{form|pdf|image|audio,s3key=R2 key,sha256}, pages, chunks{text,box,hash}, press_facts(JSONB nullable + not_stated), drafts{headline[3],summary,detail × EN/HI}, revisions{diff,by,reason}, approvals{by,at,checklist}, audit_log(append-only), api_keys(hashed)`.

## 4. Flows
- Upload: tRPC mint (authZ+quota) → PUT direct to R2 (bypass host limits) → complete+Head → Inngest validate (magic-bytes/ClamAV/ffprobe) → Trigger job.
- Audio: ffprobe → VAD chunk 30s–5min overlap → router (Indic/codemix→Sarvam codemix+unknown triage; EN/word-ts→OpenAI) → verbatim segments → redact → structure.
- Publish gate: Jev max P(wrong)>0.7 or neutrality flag (guilt/communal) → block; crime/casualty null+not_stated unless cited; no token = no publish; timeout escalates.
- R2 events (future): Queue consumer for thumbnails/scan; cron reconciler keeps PG↔Qdrant in sync.

## 5. Non-goals / invariants
- VLM may interpret, never attest (geometry+confidence = record).
- Audit proves provenance, not truth. MT alone not authoritative for official release.
- Neon login required before any `neon deploy`; R2 accountId/tokens required before bucket ops. Nothing invented.
