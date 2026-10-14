# SPEC 009 — Qdrant Semantic Vector Index & Precedent Retrieval

Status: Implemented and Verified

## Architecture (§3 & §6)
Postgres is the immutable source of truth for documents, revisions, and approvals.
Qdrant serves as a derived semantic vector index over approved press notes and fact chunks, enabling officers to instantly retrieve relevant precedents, jurisdictional classifications, and standard phrasing within their tenant partition.

## Deep Module (`src/lib/vector/qdrant.ts`)
- Port: `VectorIndex`
  - `upsertPoint(point: VectorPoint): Promise<Result<void, VectorError>>`
  - `searchSimilar(query: VectorSearchQuery): Promise<Result<readonly VectorSearchResult[], VectorError>>`
  - `deletePoint(id: string, tenantId: string): Promise<Result<void, VectorError>>`
- Data Types:
  - `VectorPoint`: `{ id, tenantId, vector: number[], text: string, metadata?: Record<string, unknown> }`
  - `VectorSearchQuery`: `{ tenantId, vector: number[], limit?: number, minScore?: number }`
  - `VectorSearchResult`: `{ id, tenantId, score, text, metadata }`
  - `VectorError`: `invalid-input | unauthorized | not-found | transport`
- Seams:
  - `createMemoryVectorIndex`: Exact cosine-similarity in-memory vector index for deterministic unit tests and zero-network local development.
  - `createQdrantVectorIndex`: Production REST HTTP adapter for Qdrant API (`/collections/{name}/points`). Enforces tenant filtering via Qdrant's payload filter (`must: [{ key: "tenantId", match: { value: tenantId } }]`).

## Quality Gates
- Strict type-safety with `noUncheckedIndexedAccess`, zero `any`, zero `@ts-ignore`.
- Unit tests: `src/lib/vector/qdrant.test.ts` (tenant isolation, cosine similarity ranking, score thresholding, deletion).
- Zero non-English literals in code logic.
