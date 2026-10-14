/**
 * documents store — persistence seam for press-note documents.
 *
 * Interface: {@link DocumentsStore} (create + list scoped by tenant). The
 * tRPC router depends only on this port; tests use the in-memory adapter
 * below while production wires the Drizzle adapter (`drizzle-documents.ts`).
 * Rows carry plain data — no ORM types leak to callers.
 */
export const DOCUMENT_STATUSES = ["draft", "processing", "ready", "approved", "failed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly status: DocumentStatus;
  readonly createdAt: Date;
}

export interface SourceRecord {
  readonly id: string;
  readonly documentId: string;
  readonly kind: string;
  readonly r2Key: string | null;
  readonly sha256: string | null;
  readonly metadata: unknown;
  readonly createdAt: Date;
}

export interface RevisionRecord {
  readonly id: string;
  readonly documentId: string;
  readonly revisionNumber: number;
  readonly diff: unknown;
  readonly factsSnapshot: unknown;
  readonly bundleSnapshot: unknown;
  readonly authorId: string;
  readonly reason: string;
  readonly approved: boolean;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly createdAt: Date;
}

export interface DocumentDetailRecord extends DocumentRecord {
  readonly sources: readonly SourceRecord[];
  readonly revisions: readonly RevisionRecord[];
}

export interface DocumentsStore {
  create(input: { tenantId: string; title: string }): Promise<DocumentRecord>;
  list(tenantId: string, limit: number): Promise<readonly DocumentRecord[]>;
  get(input: { id: string; tenantId: string }): Promise<DocumentDetailRecord | null>;
  addSource(input: { documentId: string; kind: string; r2Key?: string; sha256?: string; metadata?: unknown }): Promise<SourceRecord>;
  addRevision(input: { documentId: string; revisionNumber: number; authorId: string; diff: unknown; reason: string; factsSnapshot?: unknown; bundleSnapshot?: unknown }): Promise<RevisionRecord>;
  approve(input: { id: string; tenantId: string; approvedBy: string }): Promise<DocumentRecord | null>;
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (DOCUMENT_STATUSES as readonly string[]).includes(value);
}

export function createMemoryDocumentsStore(): DocumentsStore & { size(): number } {
  const docs: DocumentRecord[] = [];
  const sources: SourceRecord[] = [];
  const revisions: RevisionRecord[] = [];
  let docCounter = 0;
  let sourceCounter = 0;
  let revCounter = 0;

  return {
    async create(input) {
      docCounter += 1;
      const row: DocumentRecord = {
        id: `doc-${docCounter}`,
        tenantId: input.tenantId,
        title: input.title,
        status: "draft",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };
      docs.push(row);
      return row;
    },
    async list(tenantId, limit) {
      return docs.filter((r) => r.tenantId === tenantId).slice(0, limit);
    },
    async get(input) {
      const doc = docs.find((d) => d.id === input.id && d.tenantId === input.tenantId);
      if (!doc) return null;
      return {
        ...doc,
        sources: sources.filter((s) => s.documentId === doc.id),
        revisions: revisions.filter((r) => r.documentId === doc.id),
      };
    },
    async addSource(input) {
      sourceCounter += 1;
      const row: SourceRecord = {
        id: `src-${sourceCounter}`,
        documentId: input.documentId,
        kind: input.kind,
        r2Key: input.r2Key ?? null,
        sha256: input.sha256 ?? null,
        metadata: input.metadata ?? null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };
      sources.push(row);
      return row;
    },
    async addRevision(input) {
      revCounter += 1;
      const row: RevisionRecord = {
        id: `rev-${revCounter}`,
        documentId: input.documentId,
        revisionNumber: input.revisionNumber,
        diff: input.diff,
        factsSnapshot: input.factsSnapshot ?? null,
        bundleSnapshot: input.bundleSnapshot ?? null,
        authorId: input.authorId,
        reason: input.reason,
        approved: false,
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };
      revisions.push(row);
      return row;
    },
    async approve(input) {
      const idx = docs.findIndex((d) => d.id === input.id && d.tenantId === input.tenantId);
      if (idx === -1) return null;
      const current = docs[idx];
      if (!current) return null;
      const updated: DocumentRecord = {
        ...current,
        status: "approved",
      };
      docs[idx] = updated;

      // Mark the latest revision approved
      const docRevs = revisions.filter((r) => r.documentId === input.id);
      const latestRev = docRevs[docRevs.length - 1];
      if (latestRev) {
        const revIdx = revisions.findIndex((r) => r.id === latestRev.id);
        if (revIdx !== -1) {
          revisions[revIdx] = {
            ...latestRev,
            approved: true,
            approvedBy: input.approvedBy,
            approvedAt: new Date("2026-01-01T00:00:00Z"),
          };
        }
      }
      return updated;
    },
    size() {
      return docs.length;
    },
  };
}
