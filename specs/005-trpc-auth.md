# SPEC 005 — tRPC + Managed Auth ✅ implemented (feat 4)

Modules: `src/lib/auth` (`config.ts` pure validation + `server.ts` thin SDK leaf,
verified by build + live HTTP, never unit-imported), `src/server/session.ts`
(pure `resolveSession`), `src/server/documents/store.ts` (port) +
`drizzle-documents.ts` (Drizzle adapter, narrows `status` text at runtime),
`src/server/trpc.ts` (`createAppRouter(store)`; public `health`, protected
`documents.create/list` with zod tenant/title/limit validation),
`src/server/context.ts` (route-only: session map + module-scope pool),
`src/app/api/auth/[...path]` + `src/app/api/trpc/[trpc]` routes,
`src/lib/trpc/client.ts` (per-request factories, no singletons).

Tests (8): health public, 401-before-store, tenant scoping, BAD_REQUEST
before store, session mapping incl. malformed, config fail-fast naming vars.
Live HTTP vs `next start`: `health` 200, `/api/auth/ok` 200 `{"ok":true}`,
signed-out `documents.list` 401 UNAUTHORIZED — boundary proven end-to-end.

Known gap (feat 5): tenant comes from validated input, not memberships + RLS.
`NEON_AUTH_COOKIE_SECRET` minted (44-char base64) into `.env.local` + User env.
