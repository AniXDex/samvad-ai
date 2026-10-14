import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { createFakeVerifier, createLayaVerifier, LAYA_MAX_QUESTIONS } from "./verify";

describe("verify module", () => {
  test("fake verifier answers from its table through the interface", async () => {
    const verifier = createFakeVerifier({ grounded: { probabilityTrue: 0.12, confidence: 0.9 } });
    const result = await verifier.verifyNoul({
      state: "The total is 4200 as per FIR page 2.",
      checks: [{ id: "grounded", instructions: "Is the total stated in the text?" }],
    });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.probabilityTrue).toBe(0.12);
    }
  });

  test("empty checks and oversize states fail before any network call", async () => {
    let calls = 0;
    const verifier = createLayaVerifier({
      baseUrl: "https://unused.example",
      apiKey: "unused",
      post: () => {
        calls += 1;
        return Promise.resolve({});
      },
    });
    const empty = await verifier.verifyNoul({ state: "x", checks: [] });
    expect(isErr(empty)).toBe(true);

    const big = await verifier.verifyNoul({ state: "x".repeat(5000), checks: [{ id: "a", instructions: "b" }] });
    expect(isErr(big)).toBe(true);
    if (isErr(big) && big.error.kind === "invalid-input") {
      expect(big.error.issues.join(" ")).toContain("trim decisive-first");
    }
    expect(calls).toBe(0);
  });

  test("duplicate ids and oversized batches are rejected", async () => {
    const live = createLayaVerifier({
      baseUrl: "https://unused.example",
      apiKey: "unused",
      post: () => Promise.resolve({ answers: {} }),
    });
    const dupes = await live.verifyNoul({
      state: "x",
      checks: [
        { id: "a", instructions: "first" },
        { id: "a", instructions: "second" },
      ],
    });
    expect(isErr(dupes)).toBe(true);
    if (isErr(dupes) && dupes.error.kind === "invalid-input") {
      expect(dupes.error.issues.join(" ")).toContain("unique");
    }

    const many = await live.verifyNoul({
      state: "x",
      checks: Array.from({ length: LAYA_MAX_QUESTIONS + 1 }, (_, i) => ({ id: `q${i}`, instructions: "y" })),
    });
    expect(isErr(many)).toBe(true);
  });

  test("malformed payloads become transport failures, never throws", async () => {
    const verifier = createLayaVerifier({
      baseUrl: "https://unused.example",
      apiKey: "unused",
      post: () => Promise.resolve({ nope: true }),
    });
    const result = await verifier.verifyNoul({ state: "x", checks: [{ id: "a", instructions: "b" }] });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.kind).toBe("transport");
  });
});
