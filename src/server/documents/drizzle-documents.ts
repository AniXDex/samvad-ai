/**
 * Drizzle adapter — production {@link DocumentsStore} over Lakebase Postgres.
 * Internal seam: instantiated by the route layer with a real database, never
 * by feature code or unit tests. Timestamps come from the database row.
 */
import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import { isDocumentStatus, type DocumentRecord, type DocumentsStore } from "./store";

export function createDrizzleDocumentsStore(db: NodePgDatabase<typeof schema>): DocumentsStore {
  return {
    async create(input): Promise<DocumentRecord> {
      const inserted = await db
        .insert(schema.documents)
        .values({ tenantId: input.tenantId, title: input.title })
        .returning({
          id: schema.documents.id,
          tenantId: schema.documents.tenantId,
          title: schema.documents.title,
          status: schema.documents.status,
          createdAt: schema.documents.createdAt,
        });
      const row = inserted[0];
      if (!row || !isDocumentStatus(row.status)) throw new Error("documents insert returned an unexpected row");
      return { id: row.id, tenantId: row.tenantId, title: row.title, status: row.status, createdAt: row.createdAt };
    },
    async list(tenantId, limit): Promise<readonly DocumentRecord[]> {
      const rows = await db
        .select({
          id: schema.documents.id,
          tenantId: schema.documents.tenantId,
          title: schema.documents.title,
          status: schema.documents.status,
          createdAt: schema.documents.createdAt,
        })
        .from(schema.documents)
        .where(eq(schema.documents.tenantId, tenantId))
        .orderBy(desc(schema.documents.createdAt))
        .limit(limit);
      const records: DocumentRecord[] = [];
      for (const row of rows) {
        if (isDocumentStatus(row.status)) {
          records.push({ id: row.id, tenantId: row.tenantId, title: row.title, status: row.status, createdAt: row.createdAt });
        }
      }
      return records;
    },
  };
}
