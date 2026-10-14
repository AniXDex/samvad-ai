/**
 * Route-layer context — the only place Clerk sessions and the database
 * pool meet. `resolveSession` is pure (malformed payloads → null) and unit
 * tested; `getStore` reuses one module-scope pool per server instance so
 * requests never open pools per call. Tests cover `resolveSession` and never
 * touch the pool.
 */
import { auth } from "@clerk/nextjs/server";
import { createDb, pickConnectionString } from "@/lib/db/db";
import { isOk } from "@/lib/result/result";
import { createDrizzleDocumentsStore } from "@/server/documents/drizzle-documents";
import type { DocumentsStore } from "@/server/documents/store";
import { resolveSession } from "@/server/session";
import type { Context } from "@/server/trpc";

let cachedStore: DocumentsStore | null = null;

export function getStore(): DocumentsStore {
  if (cachedStore) return cachedStore;
  const picked = pickConnectionString(
    { pooled: process.env.DATABASE_URL, direct: process.env.DATABASE_URL_UNPOOLED },
    "app",
  );
  if (!isOk(picked)) throw new Error(picked.error);
  const { db } = createDb(picked.value);
  cachedStore = createDrizzleDocumentsStore(db);
  return cachedStore;
}

export async function buildContext(): Promise<Context> {
  const { userId, isAuthenticated } = await auth();
  return { session: resolveSession(isAuthenticated && userId ? { user: { id: userId } } : null) };
}


