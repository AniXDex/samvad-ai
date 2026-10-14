import { describe, expect, test } from "vitest";
import { structureFacts } from "@/lib/press-facts/facts";
import { isErr, isOk } from "@/lib/result/result";
import {
  createFakeClaimExtractor,
  createLlmClaimExtractor,
  type ExtractionOutput,
} from "./claim-extractor";

describe("claim extractor module", () => {
  test("validates input before calling LLM endpoint", async () => {
    let called = false;
    const extractor = createLlmClaimExtractor({
      apiKey: "dummy-key",
      baseUrl: "https://llm.example.com",
      model: "test-model",
      maxChars: 50,
      post: async () => {
        called = true;
        return {};
      },
    });

    const empty = await extractor.extractClaims({ sourceId: "", text: "evidence" });
    expect(isErr(empty)).toBe(true);
    if (isErr(empty)) {
      expect(empty.error.kind).toBe("invalid-input");
    }

    const oversize = await extractor.extractClaims({
      sourceId: "src-1",
      text: "a".repeat(100),
    });
    expect(isErr(oversize)).toBe(true);
    if (isErr(oversize)) {
      expect(oversize.error.kind).toBe("invalid-input");
    }

    expect(called).toBe(false);
  });

  test("parses structured claims and feeds into structureFacts", async () => {
    const fakeLlmJson = {
      spans: [
        { locator: "para-1", text: "FIR No. 402 registered at Cyber Police Station" },
        { locator: "para-2", text: "Three accused persons arrested in connection with online scam" },
      ],
      claims: {
        event: [{ spanIndex: 0, value: "FIR registered for cyber fraud" }],
        accused: [{ spanIndex: 1, value: "Three accused persons" }],
        actionTaken: [{ spanIndex: 1, value: "Arrested and produced before magistrate" }],
      },
    };

    const extractor = createLlmClaimExtractor({
      apiKey: "dummy-key",
      baseUrl: "https://llm.example.com",
      model: "test-model",
      post: async () => ({
        choices: [
          {
            message: {
              content: `\`\`\`json\n${JSON.stringify(fakeLlmJson)}\n\`\`\``,
            },
          },
        ],
      }),
    });

    const extracted = await extractor.extractClaims({
      sourceId: "src-fir-1",
      text: "FIR No. 402 registered at Cyber Police Station. Three accused persons arrested in connection with online scam.",
    });

    expect(isOk(extracted)).toBe(true);
    if (isOk(extracted)) {
      expect(extracted.value.spans).toHaveLength(2);
      expect(extracted.value.spans[0]?.locator).toBe("para-1");
      expect(extracted.value.claims["event"]?.[0]?.value).toBe("FIR registered for cyber fraud");

      // Verify it feeds directly into deterministic structureFacts
      const factsResult = structureFacts({
        spans: extracted.value.spans,
        claims: extracted.value.claims,
      });
      expect(isOk(factsResult)).toBe(true);
      if (isOk(factsResult)) {
        expect(factsResult.value.event.status).toBe("confirmed");
        expect(factsResult.value.accused.status).toBe("confirmed");
      }
    }
  });

  test("handles malformed JSON from LLM gracefully with parse-error", async () => {
    const extractor = createLlmClaimExtractor({
      apiKey: "dummy-key",
      baseUrl: "https://llm.example.com",
      model: "test-model",
      post: async () => ({
        choices: [{ message: { content: "Sorry, I cannot produce JSON." } }],
      }),
    });

    const res = await extractor.extractClaims({
      sourceId: "src-1",
      text: "Incident report text",
    });

    expect(isErr(res)).toBe(true);
    if (isErr(res)) {
      expect(res.error.kind).toBe("parse-error");
    }
  });

  test("fake adapter provides deterministic offline test seam", async () => {
    const preset: ExtractionOutput = {
      spans: [{ sourceId: "s-1", locator: "l-1", text: "Two injured" }],
      claims: {
        injured: [{ spanIndex: 0, value: "2" }],
      },
    };

    const fake = createFakeClaimExtractor(preset);
    const res = await fake.extractClaims({ sourceId: "s-1", text: "Two injured" });

    expect(isOk(res)).toBe(true);
    if (isOk(res)) {
      expect(res.value).toEqual(preset);
    }
  });
});
