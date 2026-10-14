/**
 * Route-layer context — the only place Clerk sessions and the database
 * pool meet. `resolveSession` is pure (malformed payloads → null) and unit
 * tested; `getStore` reuses one module-scope pool per server instance so
 * requests never open pools per call. Tests cover `resolveSession` and never
 * touch the pool.
 */
import { auth } from "@clerk/nextjs/server";
import { S3Client } from "@aws-sdk/client-s3";
import { createDb, pickConnectionString } from "@/lib/db/db";
import { createS3Connection } from "@/lib/r2/adapters/s3";
import { createR2Module, type R2Module } from "@/lib/r2/r2";
import { isOk } from "@/lib/result/result";
import { createDrizzleDocumentsStore } from "@/server/documents/drizzle-documents";
import type { DocumentsStore } from "@/server/documents/store";
import { resolveSession } from "@/server/session";
import type { Context } from "@/server/trpc";
import {
  createMemoryVectorIndex,
  createQdrantVectorIndex,
  type VectorIndex,
} from "@/lib/vector/qdrant";

let cachedStore: DocumentsStore | null = null;
let cachedR2: R2Module | null = null;
let cachedVector: VectorIndex | null = null;

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

export function getR2(): R2Module | null {
  if (cachedR2) return cachedR2;
  const endpoint = process.env["R2_S3_ENDPOINT"];
  const accessKeyId = process.env["R2_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["R2_SECRET_ACCESS_KEY"];
  const bucket = process.env["R2_BUCKET"] ?? "examgpt";
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  cachedR2 = createR2Module({
    connection: createS3Connection({ client, bucket }),
    bucket,
  });
  return cachedR2;
}

export async function buildContext(): Promise<Context> {
  const { userId, isAuthenticated } = await auth();
  return { session: resolveSession(isAuthenticated && userId ? { user: { id: userId } } : null) };
}

export function getVectorIndex(): VectorIndex {
  if (cachedVector) return cachedVector;
  const qdrantUrl = process.env.QDRANT_URL;
  if (qdrantUrl) {
    cachedVector = createQdrantVectorIndex({
      url: qdrantUrl,
      apiKey: process.env.QDRANT_API_KEY,
    });
  } else {
    cachedVector = createMemoryVectorIndex();
  }
  return cachedVector;
}


