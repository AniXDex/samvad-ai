# SPEC 010 — mem0 Style & Entity Memory

Status: Implemented and Verified

## Architecture (§2 & §6)
The system learns style guidelines, departmental vocabulary, and recurring entity associations ONLY from approved press notes — never from drafts, rejected submissions, or unverified claims.

## Deep Module (`src/lib/memory/mem0.ts`)
- Port: `StyleMemoryEngine`
  - `addApprovedNote(input: { userId: string; tenantId: string; noteId: string; text: string; metadata?: Record<string, unknown> }): Promise<Result<{ id: string }, MemoryError>>`
  - `searchStyleGuidance(input: { userId: string; tenantId: string; query: string }): Promise<Result<readonly StyleGuidance[], MemoryError>>`
- Data Types:
  - `StyleGuidance`: `{ id: string; memory: string; score?: number }`
  - `MemoryError`: `{ kind: "unauthorized" | "invalid-input" | "rate-limited" | "transport"; message: string }`
- Seams:
  - `createMemoryStoreFake`: In-memory deterministic mock for test isolation.
  - `createMem0Adapter`: Production HTTP adapter targeting `https://api.mem0.ai/v1/memories`. Handles 401/429/500 cleanly with no thrown exceptions.

## Human Approval Gate
Only approved press notes are passed to `addApprovedNote`, ensuring corrupted or sensational drafts can never contaminate the officer's style memory.

## Quality Gates
- Strict type-safety with `noUncheckedIndexedAccess`, zero `any`, zero `@ts-ignore`.
- Unit tests: `src/lib/memory/mem0.test.ts`.
- Zero non-English literals in code logic.
