/**
 * Qdrant vector index module — semantic search & precedent retrieval seam.
 *
 * Interface: {@link VectorIndex}. Consumed by background indexing tasks and
 * officer research queries. Enforces tenant partitioning on all searches so
 * cross-jurisdiction document leakage is structurally impossible.
 */
import { err, ok, type Result } from "@/lib/result/result";

export interface VectorPoint {
  readonly id: string;
  readonly tenantId: string;
  readonly vector: readonly number[];
  readonly text: string;
  readonly metadata?: Record<string, unknown>;
}

export interface VectorSearchQuery {
  readonly tenantId: string;
  readonly vector: readonly number[];
  readonly limit?: number;
  readonly minScore?: number;
}

export interface VectorSearchResult {
  readonly id: string;
  readonly tenantId: string;
  readonly score: number;
  readonly text: string;
  readonly metadata: Record<string, unknown>;
}

export type VectorError =
  | { readonly kind: "invalid-input"; readonly issues: readonly string[] }
  | { readonly kind: "unauthorized"; readonly message: string }
  | { readonly kind: "not-found"; readonly message: string }
  | { readonly kind: "transport"; readonly message: string };

export interface VectorIndex {
  upsertPoint(point: VectorPoint): Promise<Result<void, VectorError>>;
  searchSimilar(query: VectorSearchQuery): Promise<Result<readonly VectorSearchResult[], VectorError>>;
  deletePoint(id: string, tenantId: string): Promise<Result<void, VectorError>>;
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dotProduct += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function createMemoryVectorIndex(): VectorIndex & { size(): number } {
  const points: VectorPoint[] = [];

  return {
    async upsertPoint(point: VectorPoint): Promise<Result<void, VectorError>> {
      if (!point.id || !point.tenantId) {
        return err({ kind: "invalid-input", issues: ["Point ID and tenantId are required"] });
      }
      if (point.vector.length === 0) {
        return err({ kind: "invalid-input", issues: ["Vector must not be empty"] });
      }

      const idx = points.findIndex((p) => p.id === point.id && p.tenantId === point.tenantId);
      if (idx !== -1) {
        points[idx] = point;
      } else {
        points.push(point);
      }
      return ok(undefined);
    },

    async searchSimilar(query: VectorSearchQuery): Promise<Result<readonly VectorSearchResult[], VectorError>> {
      if (!query.tenantId) {
        return err({ kind: "invalid-input", issues: ["tenantId is required for vector search"] });
      }
      if (query.vector.length === 0) {
        return err({ kind: "invalid-input", issues: ["Query vector must not be empty"] });
      }

      const limit = query.limit ?? 10;
      const minScore = query.minScore ?? 0.0;

      // Filter by tenantId strictly
      const tenantPoints = points.filter((p) => p.tenantId === query.tenantId);

      const scored = tenantPoints
        .map((p) => ({
          id: p.id,
          tenantId: p.tenantId,
          score: cosineSimilarity(query.vector, p.vector),
          text: p.text,
          metadata: p.metadata ?? {},
        }))
        .filter((r) => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return ok(scored);
    },

    async deletePoint(id: string, tenantId: string): Promise<Result<void, VectorError>> {
      const idx = points.findIndex((p) => p.id === id && p.tenantId === tenantId);
      if (idx !== -1) {
        points.splice(idx, 1);
      }
      return ok(undefined);
    },

    size(): number {
      return points.length;
    },
  };
}

export interface QdrantConfig {
  readonly url: string;
  readonly apiKey?: string;
  readonly collectionName?: string;
}

export function createQdrantVectorIndex(config: QdrantConfig): VectorIndex {
  const collection = config.collectionName ?? "samvaad_dossiers";
  const baseUrl = config.url.replace(/\/$/, "");

  function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (config.apiKey) {
      headers["api-key"] = config.apiKey;
    }
    return headers;
  }

  return {
    async upsertPoint(point: VectorPoint): Promise<Result<void, VectorError>> {
      if (!point.id || !point.tenantId) {
        return err({ kind: "invalid-input", issues: ["Point ID and tenantId are required"] });
      }
      if (point.vector.length === 0) {
        return err({ kind: "invalid-input", issues: ["Vector must not be empty"] });
      }

      try {
        const response = await fetch(`${baseUrl}/collections/${collection}/points`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            points: [
              {
                id: point.id,
                vector: point.vector,
                payload: {
                  tenantId: point.tenantId,
                  text: point.text,
                  ...(point.metadata ?? {}),
                },
              },
            ],
          }),
        });

        if (response.status === 401 || response.status === 403) {
          return err({ kind: "unauthorized", message: "Unauthorized Qdrant access" });
        }
        if (!response.ok) {
          const text = await response.text();
          return err({ kind: "transport", message: `Qdrant upsert returned ${response.status}: ${text.slice(0, 200)}` });
        }

        return ok(undefined);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return err({ kind: "transport", message });
      }
    },

    async searchSimilar(query: VectorSearchQuery): Promise<Result<readonly VectorSearchResult[], VectorError>> {
      if (!query.tenantId) {
        return err({ kind: "invalid-input", issues: ["tenantId is required for vector search"] });
      }
      if (query.vector.length === 0) {
        return err({ kind: "invalid-input", issues: ["Query vector must not be empty"] });
      }

      const limit = query.limit ?? 10;
      const minScore = query.minScore ?? 0.0;

      try {
        const response = await fetch(`${baseUrl}/collections/${collection}/points/search`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            vector: query.vector,
            limit,
            score_threshold: minScore,
            filter: {
              must: [
                {
                  key: "tenantId",
                  match: {
                    value: query.tenantId,
                  },
                },
              ],
            },
            with_payload: true,
          }),
        });

        if (response.status === 401 || response.status === 403) {
          return err({ kind: "unauthorized", message: "Unauthorized Qdrant access" });
        }
        if (!response.ok) {
          const text = await response.text();
          return err({ kind: "transport", message: `Qdrant search returned ${response.status}: ${text.slice(0, 200)}` });
        }

        interface RawQdrantPoint {
          readonly id?: unknown;
          readonly score?: unknown;
          readonly payload?: Record<string, unknown>;
        }
        interface RawQdrantResponse {
          readonly result?: unknown;
        }

        const data = (await response.json()) as RawQdrantResponse;
        const results = Array.isArray(data.result) ? (data.result as readonly RawQdrantPoint[]) : [];

        const mapped: VectorSearchResult[] = [];
        for (const item of results) {
          const id = typeof item.id === "string" || typeof item.id === "number" ? String(item.id) : "";
          const score = typeof item.score === "number" ? item.score : 0;
          const payload = item.payload ?? {};
          const tenantId = typeof payload.tenantId === "string" ? payload.tenantId : query.tenantId;
          const text = typeof payload.text === "string" ? payload.text : "";

          mapped.push({
            id,
            tenantId,
            score,
            text,
            metadata: payload,
          });
        }

        return ok(mapped);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return err({ kind: "transport", message });
      }
    },

    async deletePoint(id: string, tenantId: string): Promise<Result<void, VectorError>> {
      try {
        const response = await fetch(`${baseUrl}/collections/${collection}/points/delete`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            points: [id],
            filter: {
              must: [{ key: "tenantId", match: { value: tenantId } }],
            },
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          return err({ kind: "transport", message: `Qdrant delete returned ${response.status}: ${text.slice(0, 200)}` });
        }

        return ok(undefined);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return err({ kind: "transport", message });
      }
    },
  };
}
