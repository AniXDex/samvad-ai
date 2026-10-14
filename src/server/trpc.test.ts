import { describe, expect, test } from "vitest";
import { createMemoryDocumentsStore } from "@/server/documents/store";
import { createAppRouter, type Context } from "@/server/trpc";

const signedIn: Context = { session: { user: { id: "user-1" } } };
const signedOut: Context = { session: null };

describe("tRPC router", () => {
  test("health is public", async () => {
    const caller = createAppRouter(createMemoryDocumentsStore()).createCaller(signedOut);
    await expect(caller.health()).resolves.toEqual({ status: "ok", service: "samvaad-ai" });
  });

  test("documents.create rejects signed-out callers before touching the store", async () => {
    const store = createMemoryDocumentsStore();
    const caller = createAppRouter(store).createCaller(signedOut);
    await expect(caller.documents.create({ tenantId: "t-1", title: "x" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(store.size()).toBe(0);
  });

  test("documents round-trip is tenant-scoped", async () => {
    const caller = createAppRouter(createMemoryDocumentsStore()).createCaller(signedIn);
    await caller.documents.create({ tenantId: "t-1", title: "first" });
    await caller.documents.create({ tenantId: "t-2", title: "other tenant" });
    const mine = await caller.documents.list({ tenantId: "t-1" });
    expect(mine.map((d) => d.title)).toEqual(["first"]);
  });

  test("invalid input never reaches the store", async () => {
    const store = createMemoryDocumentsStore();
    const caller = createAppRouter(store).createCaller(signedIn);
    await expect(caller.documents.create({ tenantId: "../evil", title: "x" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.documents.create({ tenantId: "t-1", title: "" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(store.size()).toBe(0);
  });

  test("documents.get returns detail with sources and revisions", async () => {
    const store = createMemoryDocumentsStore();
    const caller = createAppRouter(store).createCaller(signedIn);
    const created = await caller.documents.create({ tenantId: "t-1", title: "Press Note 1" });

    const detail = await caller.documents.get({ tenantId: "t-1", id: created.id });
    expect(detail.id).toBe(created.id);
    expect(detail.sources).toEqual([]);
    expect(detail.revisions).toEqual([]);

    await expect(
      caller.documents.get({ tenantId: "t-2", id: created.id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("documents.addRevision and documents.approve lifecycle", async () => {
    const store = createMemoryDocumentsStore();
    const caller = createAppRouter(store).createCaller(signedIn);
    const created = await caller.documents.create({ tenantId: "t-1", title: "FIR Press Release" });

    const rev = await caller.documents.addRevision({
      tenantId: "t-1",
      documentId: created.id,
      revisionNumber: 1,
      diff: { title: "FIR Press Release - Draft" },
      reason: "Initial draft",
    });
    expect(rev.authorId).toBe("user-1");
    expect(rev.approved).toBe(false);

    const approved = await caller.documents.approve({ tenantId: "t-1", id: created.id });
    expect(approved.status).toBe("approved");

    const detail = await caller.documents.get({ tenantId: "t-1", id: created.id });
    expect(detail.status).toBe("approved");
    expect(detail.revisions[0]?.approved).toBe(true);
    expect(detail.revisions[0]?.approvedBy).toBe("user-1");
  });

  test("r2.mint and r2.complete create grants and attach sources", async () => {
    const { createMemoryConnection } = await import("@/lib/r2/adapters/memory");
    const { createR2Module } = await import("@/lib/r2/r2");
    const connection = createMemoryConnection();
    const r2 = createR2Module({ connection, bucket: "test-bucket" });

    const store = createMemoryDocumentsStore();
    const caller = createAppRouter(store, r2).createCaller(signedIn);
    const created = await caller.documents.create({ tenantId: "t-1", title: "Crime Report" });

    const grant = await caller.r2.mint({
      tenantId: "t-1",
      documentId: created.id,
      extension: "pdf",
      contentType: "application/pdf",
      contentLengthBytes: 2048,
    });
    expect(grant.key).toBe(`tenants/t-1/docs/${created.id}/source.pdf`);
    expect(grant.uploadUrl).toBeDefined();

    const source = await caller.r2.complete({
      tenantId: "t-1",
      documentId: created.id,
      key: grant.key,
      kind: "pdf",
      sha256: "dummy-sha256",
    });
    expect(source.kind).toBe("pdf");
    expect(source.r2Key).toBe(grant.key);

    const detail = await caller.documents.get({ tenantId: "t-1", id: created.id });
    expect(detail.sources).toHaveLength(1);
    expect(detail.sources[0]?.r2Key).toBe(grant.key);
  });

  test("r2.mint throws NOT_IMPLEMENTED when R2 is not provided", async () => {
    const store = createMemoryDocumentsStore();
    const caller = createAppRouter(store, null).createCaller(signedIn);
    await expect(
      caller.r2.mint({
        tenantId: "t-1",
        documentId: "doc-1",
        extension: "pdf",
        contentType: "application/pdf",
        contentLengthBytes: 2048,
      })
    ).rejects.toMatchObject({ code: "NOT_IMPLEMENTED" });
  });
});
