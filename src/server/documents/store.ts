/**
 * documents store — persistence seam for press-note documents.
 *
 * Interface: {@link DocumentsStore} (create + list scoped by tenant). The
 * tRPC router depends only on this port; tests use the in-memory adapter
 * below while production wires the Drizzle adapter (`drizzle-documents.ts`).
 * Rows carry plain data — no ORM types leak to callers.
 */
export const DOCUMENT_STATUSES = ["draft", "processing", "ready", "failed"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly status: DocumentStatus;
  readonly createdAt: Date;
}

export interface DocumentsStore {
  create(input: { tenantId: string; title: string }): Promise<DocumentRecord>;
  list(tenantId: string, limit: number): Promise<readonly DocumentRecord[]>;
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (DOCUMENT_STATUSES as readonly string[]).includes(value);
}

export function createMemoryDocumentsStore(): DocumentsStore & { size(): number } {
  const rows: DocumentRecord[] = [];
  let counter = 0;
  return {
    async create(input) {
      counter += 1;
      const row: DocumentRecord = {
        id: `doc-${counter}`,
        tenantId: input.tenantId,
        title: input.title,
        status: "draft",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      };
      rows.push(row);
      return row;
    },
    async list(tenantId, limit) {
      return rows.filter((r) => r.tenantId === tenantId).slice(0, limit);
    },
    size() {
      return rows.length;
    },
  };
}
