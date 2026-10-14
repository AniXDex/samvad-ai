/**
 * db schema module — Postgres table definitions (Drizzle).
 *
 * Interface: the exported table objects (`documents`, `sources`). Drizzle
 * infers row types from them, so callers get full type safety with no manual
 * DTOs and no `any`. Timestamps are timezone-aware; ids are database-generated
 * UUIDs so callers never invent keys. `sources.r2Key` stores the key built by
 * the r2 module — the seam between the two modules is that string, nothing more.
 */
import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DocumentRow = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export const SOURCES_KINDS = ["form", "pdf", "image", "audio"] as const;
export type SourceKind = (typeof SOURCES_KINDS)[number];

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  r2Key: text("r2_key"),
  sha256: text("sha256"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SourceRow = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
