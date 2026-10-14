# SPEC 005 — tRPC + Clerk ✅ migrated (feat: clerk)

Modules: `src/server/session.ts` (pure `resolveSession`),
`src/server/documents/store.ts` (port) +
`drizzle-documents.ts` (Drizzle adapter, narrows `status` text at runtime),
`src/server/trpc.ts` (`createAppRouter(store)`; public `health`, protected
`documents.create/list` with zod tenant/title/limit validation),
`src/server/context.ts` (route-only: Clerk `auth()` session map +
module-scope pool), `src/app/api/trpc/[trpc]` route,
`src/proxy.ts` (bare `clerkMiddleware` + matcher incl. `/(api|trpc)(.*)` and
`/__clerk/(.*)`), `src/app/layout.tsx` (`ClerkProvider` in `<body>` with
shadcn theme + `Show` sign-in/sign-up + `UserButton`),
`src/app/sign-in/[[...sign-in]]` + `src/app/sign-up/[[...sign-up]]` (Clerk `<SignIn/>`/`<SignUp/>`).

Tests: health public, 401-before-store, tenant scoping, BAD_REQUEST
before store, session mapping incl. malformed.
Live HTTP vs dev server: `health` 200 `{"status":"ok","service":"samvaad-ai"}`,
`/sign-in` 200, signed-out `documents.list` 401 UNAUTHORIZED — boundary proven end-to-end.

Memberships + RBAC gap closed:
- `memberships` table in Drizzle schema queried via `getMembership`, `addMembership`, `listMemberships`.
- tRPC router enforces verified tenant membership across all operations.
- Role checks: `approver` strictly required for `documents.approve`, `contributor`/`approver` required for mutations, `auditor` restricted to read-only (`documents.list`/`get`).
- Unit tested in `src/server/trpc.test.ts` (11/11 passed).
Clerk is the active auth provider.

