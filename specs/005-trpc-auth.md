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

Known gap: tenant comes from validated input, not memberships + RLS.
Clerk is the active auth provider.
