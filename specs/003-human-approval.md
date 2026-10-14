# SPEC 003 — Human approve + history (SKIT005 bullets 6–7 + global constraint)

## Goal
No publish without human token. Full provenance.

## Acceptance
- Roles (Neon Managed Auth): contributor (upload/edit), approver (approve/publish), auditor (read+export). Every mutation carries user id (neon-auth skill: `@neondatabase/auth` wrapper, trusted domains registered per env).
- Trigger `wait.forToken("press-approval")`: editor (shadcn) shows sources (R2 PDF render, audio+transcript), draft with per-sentence cites, Jev+neutrality flags, low-conf banners. Edit → new `revisions{diff,by,reason}` + re-verify. Approve requires token + checkbox "verified crime/casualty vs sources". Reject/request-changes resumes with comments. Timeout escalates, never auto-publishes.
- Postgres `press_note{current_version}, revisions[], sources[], approvals[]`; Qdrant final embeddings (derived); mem0 updated ONLY after approve.
- Test: two users isolation (own-data access, cross-deny); publish without token impossible (P0 if bypass); revision export contains all versions+hashes+approver.
