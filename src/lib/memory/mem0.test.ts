import { describe, expect, test, vi } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { createMem0Adapter, createMemoryStoreFake } from "./mem0";

describe("mem0 Style Memory Module", () => {
  test("fake store stores approved note and retrieves style guidance scoped by tenant", async () => {
    const store = createMemoryStoreFake();

    const addResult = await store.addApprovedNote({
      userId: "officer-1",
      tenantId: "sho-jaipur",
      noteId: "note-1",
      text: "The accused was apprehended under Cyber Crime FIR 42/2026.",
    });

    expect(isOk(addResult)).toBe(true);

    // Same tenant search
    const jaipurSearch = await store.searchStyleGuidance({
      userId: "officer-1",
      tenantId: "sho-jaipur",
      query: "accused",
    });

    expect(isOk(jaipurSearch)).toBe(true);
    if (isOk(jaipurSearch)) {
      expect(jaipurSearch.value).toHaveLength(1);
      expect(jaipurSearch.value[0]?.memory).toContain("sho-jaipur");
    }

    // Other tenant search returns empty
    const jodhpurSearch = await store.searchStyleGuidance({
      userId: "officer-1",
      tenantId: "sho-jodhpur",
      query: "accused",
    });

    if (isOk(jodhpurSearch)) {
      expect(jodhpurSearch.value).toHaveLength(0);
    }
  });

  test("rejects invalid input when adding notes or searching", async () => {
    const store = createMemoryStoreFake();

    const badAdd = await store.addApprovedNote({
      userId: "",
      tenantId: "t-1",
      noteId: "n-1",
      text: "",
    });
    expect(isErr(badAdd)).toBe(true);
    if (isErr(badAdd)) {
      expect(badAdd.error.kind).toBe("invalid-input");
    }

    const badSearch = await store.searchStyleGuidance({
      userId: "",
      tenantId: "",
      query: "style",
    });
    expect(isErr(badSearch)).toBe(true);
    if (isErr(badSearch)) {
      expect(badSearch.error.kind).toBe("invalid-input");
    }
  });

  test("mem0 adapter maps 401 unauthorized cleanly without throwing", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = createMem0Adapter({ apiKey: "bad-token", baseUrl: "https://mock.mem0.ai" });
    const result = await adapter.addApprovedNote({
      userId: "user-1",
      tenantId: "t-1",
      noteId: "n-1",
      text: "Approved press note style",
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("unauthorized");
    }

    vi.unstubAllGlobals();
  });

  test("mem0 adapter maps 429 rate limit cleanly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 429,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = createMem0Adapter({ apiKey: "rate-token", baseUrl: "https://mock.mem0.ai" });
    const result = await adapter.searchStyleGuidance({
      userId: "user-1",
      tenantId: "t-1",
      query: "cyber",
    });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("rate-limited");
    }

    vi.unstubAllGlobals();
  });

  test("mem0 adapter parses search results on 200 OK", async () => {
    const mockResults = [
      { id: "mem-1", memory: "Standard press disclaimer: all accused remain innocent.", score: 0.95 },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockResults,
    });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = createMem0Adapter({ apiKey: "valid-token" });
    const result = await adapter.searchStyleGuidance({
      userId: "user-1",
      tenantId: "t-1",
      query: "disclaimer",
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.id).toBe("mem-1");
      expect(result.value[0]?.score).toBe(0.95);
    }

    vi.unstubAllGlobals();
  });
});
