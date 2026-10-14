/**
 * Live test for Mistral OCR against api.mistral.ai.
 *
 * Verifies that the production adapter handles real HTTP requests cleanly.
 * Skips automatically if MISTRAL_API_KEY is not defined in the environment.
 */
import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { createMistralOcrEngine } from "./mistral";

const apiKey = process.env.MISTRAL_API_KEY;

describe.skipIf(!apiKey)("Mistral OCR Module (Live)", () => {
  test("probes live Mistral OCR endpoint without throwing unhandled exceptions", async () => {
    const engine = createMistralOcrEngine({ apiKey: apiKey! });
    const tinyPng =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await engine.ocr({ base64DataUrl: tinyPng });

    // Live endpoint may return rate-limited (code 1300 if tier quota reached) or ok
    if (isOk(result)) {
      expect(result.value.pageCount).toBeGreaterThanOrEqual(1);
    } else {
      expect(isErr(result)).toBe(true);
      expect(["rate-limited", "unauthorized", "transport"]).toContain(result.error.kind);
    }
  });
});
