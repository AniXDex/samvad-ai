import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { createMemoryConnection } from "./adapters/memory";
import { createR2Module, documentId, tenantId, type R2ObjectKey } from "./r2";

function setup() {
  const connection = createMemoryConnection();
  const store = createR2Module({ connection, bucket: "test-bucket", now: () => new Date("2026-01-01T00:00:00Z") });
  const tenant = tenantId("tenant-1");
  const document = documentId("doc-1");
  if (!isOk(tenant) || !isOk(document)) throw new Error("test ids must be valid");
  return { connection, store, tenant: tenant.value, document: document.value };
}

describe("r2 store", () => {
  test("grant builds the server-side key and a 5-minute expiry", async () => {
    const { store, tenant, document } = setup();
    const result = await store.createUploadGrant({
      tenant,
      document,
      extension: "PDF",
      contentType: "application/pdf",
      contentLengthBytes: 1024,
    });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.key).toBe("tenants/tenant-1/docs/doc-1/source.pdf");
      expect(result.value.uploadUrl).toContain("tenants/tenant-1/docs/doc-1/source.pdf");
      expect(result.value.expiresAt.toISOString()).toBe("2026-01-01T00:05:00.000Z");
    }
  });

  test("extension outside the allowlist is rejected before any network call", async () => {
    const { connection, store, tenant, document } = setup();
    const result = await store.createUploadGrant({
      tenant,
      document,
      extension: "svg",
      contentType: "image/svg+xml",
      contentLengthBytes: 10,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("invalid-input");
      expect(connection.grants()).toHaveLength(0);
    }
  });

  test("MIME mismatch and oversize are reported together", async () => {
    const { store, tenant, document } = setup();
    const result = await store.createUploadGrant({
      tenant,
      document,
      extension: "pdf",
      contentType: "image/png",
      contentLengthBytes: 600 * 1024 * 1024,
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result) && result.error.kind === "invalid-input") {
      expect(result.error.issues).toHaveLength(2);
    }
  });

  test("path traversal in ids never reaches the key builder", () => {
    expect(isErr(tenantId("../x"))).toBe(true);
    expect(isErr(documentId("a/b"))).toBe(true);
  });

  test("headObject round-trips a stored object and reports missing keys", async () => {
    const { connection, store } = setup();
    const key = "tenants/tenant-1/docs/doc-1/source.pdf" as R2ObjectKey;
    const missing = await store.headObject({ key });
    expect(isErr(missing)).toBe(true);

    connection.putForTest(key, new Uint8Array([1, 2, 3]), "application/pdf");
    const found = await store.headObject({ key });
    expect(isOk(found)).toBe(true);
    if (isOk(found)) {
      expect(found.value.sizeBytes).toBe(3);
      expect(found.value.contentType).toBe("application/pdf");
    }
  });
});
