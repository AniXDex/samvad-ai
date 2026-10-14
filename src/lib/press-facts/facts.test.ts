import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { structureFacts, type CitedSpan, type StructureInput } from "./facts";

const SPANS: CitedSpan[] = [
  { sourceId: "fir-1", locator: "page 1", text: "Crime No. 12, cyber fraud" },
  { sourceId: "audio-1", locator: "segment 4", text: "three persons injured" },
  { sourceId: "audio-1", locator: "segment 9", text: "two persons injured" },
];

function input(claims: StructureInput["claims"]): StructureInput {
  return { spans: SPANS, claims };
}

describe("press-facts module", () => {
  test("cited values become confirmed with their spans", () => {
    const result = structureFacts(
      input({ event: [{ spanIndex: 0, value: "cyber fraud briefing" }], date: [{ spanIndex: 0, value: "2026-10-10" }] }),
    );
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.event).toEqual({
        value: "cyber fraud briefing",
        status: "confirmed",
        citations: [SPANS[0]],
      });
      expect(result.value.date.status).toBe("confirmed");
    }
  });

  test("missing fields are not_stated, never defaulted", () => {
    const result = structureFacts(input({}));
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.date).toEqual({ value: null, status: "not_stated", citations: [] });
      expect(result.value.casualties.dead.status).toBe("not_stated");
    }
  });

  test("uncited values stay unverified, never confirmed", () => {
    const result = structureFacts(input({ accused: [{ spanIndex: null, value: "R. Kumar" }] }));
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.accused.status).toBe("unverified");
      expect(result.value.accused.value).toBe("R. Kumar");
    }
  });

  test("disagreeing spans become conflicting with both candidates retained", () => {
    const result = structureFacts(
      input({ injured: [{ spanIndex: 1, value: "3" }, { spanIndex: 2, value: "2" }] }),
    );
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const injured = result.value.casualties.injured;
      expect(injured.status).toBe("conflicting");
      expect(injured.value).toBeNull();
      expect(injured.candidates).toHaveLength(2);
    }
  });

  test("dangling span indexes are reported, not silently dropped", () => {
    const result = structureFacts(input({ date: [{ spanIndex: 99, value: "2026-01-01" }] }));
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toHaveLength(1);
      expect(result.error[0]?.field).toBe("date");
    }
  });

  test("participant lists merge uniquely and track citation", () => {
    const result = structureFacts(
      input({ participants: [{ spanIndex: 0, value: "SP Sharma" }, { spanIndex: 0, value: "SP Sharma" }] }),
    );
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.participants).toEqual(["SP Sharma"]);
      expect(result.value.participantsCited).toBe(true);
    }
  });
});
