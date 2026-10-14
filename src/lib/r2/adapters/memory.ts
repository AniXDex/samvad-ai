/**
 * Memory adapter — in-memory {@link R2Connection} for tests. Internal seam:
 * imported by `r2.test.ts` only, never by feature code. `putForTest` and
 * `grants` exist so tests can arrange state and assert outcomes through the
 * module interface; production code cannot reach them via {@link R2Module}.
 */
import { ok, type Result } from "@/lib/result/result";
import type { ConnectionFailure, ObjectHead, R2Connection, R2ObjectKey } from "../r2";

interface StoredObject {
  readonly bytes: Uint8Array;
  readonly contentType: string;
  readonly etag: string;
}

export interface MemoryConnection extends R2Connection {
  putForTest(key: R2ObjectKey, bytes: Uint8Array, contentType: string): void;
  grants(): readonly R2ObjectKey[];
}

export function createMemoryConnection(): MemoryConnection {
  const objects = new Map<string, StoredObject>();
  const granted: R2ObjectKey[] = [];
  let counter = 0;

  return {
    async presignPut(key, presign): Promise<Result<string, ConnectionFailure>> {
      granted.push(key);
      counter += 1;
      return ok(`memory://upload/${key}?content-length=${presign.contentLengthBytes}&n=${counter}`);
    },

    async head(key: R2ObjectKey): Promise<Result<ObjectHead | null, ConnectionFailure>> {
      const found = objects.get(key);
      if (found === undefined) return ok(null);
      return ok({ key, sizeBytes: found.bytes.length, contentType: found.contentType, etag: found.etag });
    },

    putForTest(key: R2ObjectKey, bytes: Uint8Array, contentType: string): void {
      objects.set(key, { bytes, contentType, etag: `"mem-${bytes.length}"` });
    },

    grants(): readonly R2ObjectKey[] {
      return granted;
    },
  };
}
