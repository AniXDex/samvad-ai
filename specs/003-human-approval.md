# SPEC 003 — Human approve + history ✅ implemented (feat: approval editor)

Modules & Pages:
- `src/components/dossier/review-editor.tsx`: Split-screen review editor with evidence viewer, per-sentence citations, live neutrality scanning (assistive flags on presumption-of-guilt / sensational / unverified-scale words), and dual-language headline triple (<=15 words each).
- `src/app/dossiers/page.tsx` + `src/app/dossiers/[id]/page.tsx`: Officer dossier dashboard, list, and review workspace.
- `src/app/actions.ts`: Server Actions for `createDocumentAction`, `approveDocumentAction`, `saveRevisionAction`, and `processEvidenceAction`.
- Mandatory attestation dialog: Checkbox "verified crime/casualty vs sources" required before calling `approveDocumentAction`.
- Postgres audit: `memberships` and `revisions` tables with immutable record of each revision diff, reason, and author.
- Quality gates: Strict type-safety, zero `any`, zero `@ts-ignore`, zero non-English literals in `src/`.
