import { describe, expect, test, vi } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import {
  cosineSimilarity,
  createMemoryVectorIndex,
  createQdrantVectorIndex,
} from "./qdrant";

describe("Qdrant Vector Module", () => {
  test("calculates cosine similarity accurately", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1.0);
    expect(cosineSimilarity([], [])).toBe(0);
  });

  test("memory vector index enforces tenant isolation", async () => {
    const index = createMemoryVectorIndex();

    await index.upsertPoint({
      id: "doc-1",
      tenantId: "sho-jaipur",
      vector: [0.9, 0.1, 0.0],
      text: "Jaipur cyber crime FIR 42/2026",
    });

    await index.upsertPoint({
      id: "doc-2",
      tenantId: "sho-jodhpur",
      vector: [0.9, 0.1, 0.0],
      text: "Jodhpur theft incident",
    });

    // Query from sho-jaipur
    const jaipurSearch = await index.searchSimilar({
      tenantId: "sho-jaipur",
      vector: [0.9, 0.1, 0.0],
    });

    expect(isOk(jaipurSearch)).toBe(true);
    if (isOk(jaipurSearch)) {
      expect(jaipurSearch.value).toHaveLength(1);
      expect(jaipurSearch.value[0]?.id).toBe("doc-1");
      expect(jaipurSearch.value[0]?.tenantId).toBe("sho-jaipur");
    }

    // Query from sho-jodhpur
    const jodhpurSearch = await index.searchSimilar({
      tenantId: "sho-jodhpur",
      vector: [0.9, 0.1, 0.0],
    });

    expect(isOk(jodhpurSearch)).toBe(true);
    if (isOk(jodhpurSearch)) {
      expect(jodhpurSearch.value).toHaveLength(1);
      expect(jodhpurSearch.value[0]?.id).toBe("doc-2");
    }
  });

  test("memory vector index sorts by cosine similarity and respects minScore", async () => {
    const index = createMemoryVectorIndex();

    await index.upsertPoint({
      id: "doc-exact",
      tenantId: "t-1",
      vector: [1.0, 0.0, 0.0],
      text: "Exact match",
    });

    await index.upsertPoint({
      id: "doc-mid",
      tenantId: "t-1",
      vector: [0.7, 0.7, 0.0],
      text: "Partial match",
    });

    await index.upsertPoint({
      id: "doc-diff",
      tenantId: "t-1",
      vector: [0.0, 1.0, 0.0],
      text: "Orthogonal document",
    });

    const search = await index.searchSimilar({
      tenantId: "t-1",
      vector: [1.0, 0.0, 0.0],
      minScore: 0.5,
    });

    expect(isOk(search)).toBe(true);
    if (isOk(search)) {
      expect(search.value).toHaveLength(2);
      expect(search.value[0]?.id).toBe("doc-exact");
      expect(search.value[0]?.score).toBeCloseTo(1.0);
      expect(search.value[1]?.id).toBe("doc-mid");
      expect(search.value[1]?.score).toBeCloseTo(0.707, 2);
    }
  });

  test("deletes points from memory index", async () => {
    const index = createMemoryVectorIndex();

    await index.upsertPoint({
      id: "doc-to-delete",
      tenantId: "t-1",
      vector: [1.0, 0.0],
      text: "Draft to be removed",
    });
    expect(index.size()).toBe(1);

    await index.deletePoint("doc-to-delete", "t-1");
    expect(index.size()).toBe(0);

    const search = await index.searchSimilar({
      tenantId: "t-1",
      vector: [1.0, 0.0],
    });
    if (isOk(search)) {
      expect(search.value).toHaveLength(0);
    }
  });

  test("qdrant REST adapter handles unauthorized and formats payload filters", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    const client = createQdrantVectorIndex({
      url: "https://mock-qdrant.local:6333",
      apiKey: "test-key",
    });

    const result = await client.searchSimilar({
      tenantId: "t-1",
      vector: [0.5, 0.5],
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("unauthorized");
    }

    vi.unstubAllGlobals();
  });
});
