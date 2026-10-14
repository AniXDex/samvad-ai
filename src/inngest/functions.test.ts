import { describe, expect, test } from "vitest";
import { parseUploadPayload } from "./functions";

describe("Inngest uploadComplete pipeline", () => {
  test("parseUploadPayload parses valid audio payload", () => {
    const raw = {
      documentId: "doc-123",
      tenantId: "sho-jaipur",
      sourceId: "src-456",
      kind: "audio",
      audioBase64: "AAAA",
      r2Key: "tenants/sho-jaipur/docs/doc-123/source.mp3",
    };
    const parsed = parseUploadPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe("audio");
    expect(parsed?.documentId).toBe("doc-123");
    expect(parsed?.tenantId).toBe("sho-jaipur");
  });

  test("parseUploadPayload parses valid document scan payload", () => {
    const raw = {
      documentId: "doc-123",
      tenantId: "sho-jaipur",
      sourceId: "src-456",
      kind: "pdf",
      fileUrl: "https://example.com/fir.pdf",
    };
    const parsed = parseUploadPayload(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.kind).toBe("pdf");
    expect(parsed?.fileUrl).toBe("https://example.com/fir.pdf");
  });

  test("parseUploadPayload rejects invalid kinds or missing fields", () => {
    expect(parseUploadPayload(null)).toBeNull();
    expect(parseUploadPayload({})).toBeNull();
    expect(
      parseUploadPayload({
        documentId: "doc-1",
        tenantId: "t-1",
        sourceId: "s-1",
        kind: "executable",
      }),
    ).toBeNull();
    expect(
      parseUploadPayload({
        documentId: "doc-1",
        // missing tenantId
        sourceId: "s-1",
        kind: "audio",
      }),
    ).toBeNull();
  });
});
