# SPEC 003 — Human approve + history (next feat)

Roles via Neon Managed Better Auth (contributor/approver/auditor).
Trigger `wait.forToken("press-approval")`; shadcn editor shows sources,
per-sentence citations, Jev/neutrality flags, low-conf banners. Edit → new
`revisions{diff,by,reason}` + re-verify. Approve = token + checkbox
"verified crime/casualty vs sources". Timeout escalates, never auto-publishes.
Postgres tables + Qdrant derived index + mem0 write-after-approve. Blocked on:
`neon deploy` of `auth:true` (needs `neon.ts` in this folder — next feat).
