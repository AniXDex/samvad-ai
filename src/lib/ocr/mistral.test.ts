import { describe, expect, test, vi } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { createFakeOcrEngine, createMistralOcrEngine } from "./mistral";

describe("Mistral OCR Module", () => {
  test("fake OCR engine returns deterministic pages and full markdown", async () => {
    const engine = createFakeOcrEngine();
    const result = await engine.ocr({ documentUrl: "https://example.com/test.pdf" });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.pages).toHaveLength(1);
      expect(result.value.pages[0]?.markdown).toContain("FIR No: 142/2026");
      expect(result.value.pageCount).toBe(1);
      expect(result.value.model).toBe("mistral-ocr-fake");
    }
  });

  test("rejects input with zero document/image sources", async () => {
    const engine = createFakeOcrEngine();
    const result = await engine.ocr({});

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("invalid-input");
    }
  });

  test("mistral OCR engine maps 401 to unauthorized error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    const engine = createMistralOcrEngine({ apiKey: "bad-key", baseUrl: "https://mock.mistral.ai" });
    const result = await engine.ocr({ imageUrl: "https://example.com/fir.png" });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("unauthorized");
    }

    vi.unstubAllGlobals();
  });

  test("mistral OCR engine maps 429 to rate-limited error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 429,
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    const engine = createMistralOcrEngine({ apiKey: "limited-key", baseUrl: "https://mock.mistral.ai" });
    const result = await engine.ocr({ imageUrl: "https://example.com/fir.png" });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.kind).toBe("rate-limited");
      if (result.error.kind === "rate-limited") {
        expect(result.error.message).toContain("rate limit");
      }
    }

    vi.unstubAllGlobals();
  });

  test("mistral OCR engine parses successful response with layout coordinates", async () => {
    const mockResponse = {
      pages: [
        {
          index: 0,
          markdown: "## Police Report\n\nSuspect apprehended at scene.",
          images: [
            {
              id: "img_001.jpg",
              top_left_y: 100,
              top_left_x: 50,
              bottom_right_y: 300,
              bottom_right_x: 400,
            },
          ],
        },
      ],
      model: "mistral-ocr-latest",
      usage_info: { pages_processed: 1 },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockResponse,
    });
    vi.stubGlobal("fetch", mockFetch);

    const engine = createMistralOcrEngine({ apiKey: "valid-key" });
    const result = await engine.ocr({ documentUrl: "https://example.com/doc.pdf" });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.pages).toHaveLength(1);
      expect(result.value.pages[0]?.markdown).toContain("Police Report");
      expect(result.value.pages[0]?.images[0]?.id).toBe("img_001.jpg");
      expect(result.value.pages[0]?.images[0]?.top).toBe(100);
      expect(result.value.pageCount).toBe(1);
    }

    vi.unstubAllGlobals();
  });
});
