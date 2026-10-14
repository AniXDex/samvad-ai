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
});
