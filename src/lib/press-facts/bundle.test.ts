import { describe, expect, test } from "vitest";
import { isOk } from "@/lib/result/result";
import { buildDraftBundle, capHeadline } from "./bundle";
import { structureFacts, type CitedSpan } from "./facts";
import { checkNeutrality } from "./neutrality";

const SPANS: CitedSpan[] = [
  { sourceId: "fir-12", locator: "page 1", text: "Crime No. 12 under IT Act" },
  { sourceId: "brief-3", locator: "segment 2", text: "press briefing at HQ" },
];

function wordCount(s: string): number {
  return s.split(/\s+/).filter((w) => w.length > 0).length;
}

describe("bundle module", () => {
  test("headlines fit the 15-word cap by clause-dropping", () => {
    expect(wordCount(capHeadline("one two three, four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen"))).toBeLessThanOrEqual(15);
    expect(capHeadline("short headline")).toBe("short headline");
  });

  test("full bundle renders both languages with citations and no invention", () => {
    const structured = structureFacts({
      spans: SPANS,
      claims: {
        event: [{ spanIndex: 0, value: "cyber fraud crackdown" }],
        eventShort: [{ spanIndex: 0, value: "fraud crackdown" }],
        date: [{ spanIndex: 1, value: "2026-10-12" }],
        location: [{ spanIndex: 1, value: "Jaipur" }],
        actionTaken: [{ spanIndex: 0, value: "two arrests made" }],
        allegedCrime: [{ spanIndex: 0, value: "online fraud" }],
      },
    });
    if (!isOk(structured)) throw new Error("fixture must structure cleanly");
    const bundle = buildDraftBundle(structured.value);

    expect(bundle.renderedBy).toBe("template-v1");
    expect(bundle.headlinesEn).toHaveLength(3);
    for (const h of bundle.headlinesEn) expect(wordCount(h)).toBeLessThanOrEqual(15);
    expect(bundle.citedSourceIds).toEqual(expect.arrayContaining(["fir-12", "brief-3"]));
    expect(bundle.detailEn).toContain("alleged");
    expect(bundle.detailHi).toContain("कथित");
    expect(wordCount(bundle.summaryEn)).toBeGreaterThanOrEqual(20);
    // Template output itself must pass the neutrality pre-check.
    expect(checkNeutrality(bundle.detailEn)).toEqual([]);
  });

  test("conflicting casualties render as unconfirmed, never a picked number", () => {
    const structured = structureFacts({
      spans: [
        { sourceId: "a", locator: "s1", text: "two injured" },
        { sourceId: "b", locator: "s2", text: "three injured" },
      ],
      claims: {
        event: [{ spanIndex: 0, value: "road incident" }],
        injured: [{ spanIndex: 0, value: "2" }, { spanIndex: 1, value: "3" }],
      },
    });
    if (!isOk(structured)) throw new Error("fixture must structure cleanly");
    const bundle = buildDraftBundle(structured.value);
    expect(bundle.detailEn).toContain("could not be confirmed");
    expect(bundle.detailEn).not.toMatch(/\b[0-9]+ injured were reported/);
  });

  test("empty facts still produce an honest awaiting-details bundle", () => {
    const structured = structureFacts({ spans: [], claims: {} });
    if (!isOk(structured)) throw new Error("fixture must structure cleanly");
    const bundle = buildDraftBundle(structured.value);
    expect(bundle.detailEn).toContain("awaited");
    expect(bundle.citedSourceIds).toEqual([]);
  });
});
