# Permanent Memory — samvaad-ai (SKIT005)

Recorded: 2026-10-14. Loaded skills: neon, neon-postgres, neon-auth, neon-functions, cloudflare (R2 README/configuration/patterns). Always consult task-related skill before implementing; Neon docs (neon.com/docs/llms.txt, fetch .md) + Cloudflare docs (developers.cloudflare.com) are source of truth, never pre-trained info. Web research uses Firecrawl first (project opencode.json), fallback websearch only if Firecrawl unavailable — state which was used.

## Stack decisions (do not re-decide without user)
- App: Next.js 16 App Router (Node runtime for APIs) + tRPC v11 + TanStack Query + shadcn/ui (install components ONLY via shadcn CLI, e.g. `npx shadcn@latest add card`).
- Backend: Neon Lakebase Postgres (Drizzle ORM + `pg`; pooled DATABASE_URL for app traffic, DATABASE_URL_UNPOOLED direct for migrations), Neon Auth = Managed Better Auth via `@neondatabase/auth` wrapper (no `plugins` option; users/sessions in `neon_auth` schema; configure via Neon, trusted domains via `neon neon-auth domain add`), Neon Functions (slug `hello` permanent; pg pool module-scope max 5 + `attachDatabasePool`), Neon AI Gateway declared (`aiGateway:true`) for future LLM routing.
- Object storage: **Cloudflare R2** (user override). S3 SDK, region `auto`, endpoint `https://{accountId}.r2.cloudflarestorage.com`, presigned PUT URLs (short TTL) for direct browser upload, CORS via S3 SDK, minimal token scopes, lifecycles for quarantine→verified. Neon `buckets.assets` stays declared in neon.ts but app uploads go to R2.
- AI keys (user-owned): Mistral OCR, OpenAI STT, Sarvam saaras:v4 STT, TypeSafe Jev verifier. No Deepgram/AssemblyAI.
- Vector: Qdrant (separate service, not pgvector). Memory: mem0 (write only after human approve).
- Pipeline: Trigger.dev (heavy durable AI) + Inngest (event fan-out/cron). Boundary: >2min/GPU/human-token → Trigger; events/cron/<30s → Inngest.
- Workflow: arch → directories → spec files → implement feat → test → commit → push. Remote: https://github.com/Mayank-saraswal/samvaad-ai.git, branch main.

## Blockers
- Neon CLI not signed in (`neon me` = no credential; browser auth timed out). User must run `neon login`. No `neon deploy` until auth. Never create Claimable as substitute.
- R2 needs Cloudflare accountId + API tokens (R2_ACCESS_KEY_ID/SECRET) — not yet supplied. Wrangler skill covers bucket ops; do not invent bucket names.
