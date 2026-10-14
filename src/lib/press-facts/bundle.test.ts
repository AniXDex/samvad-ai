import { describe, expect, test } from "vitest";
import { isOk } from "@/lib/result/result";
import { buildDraftBundle, capHeadline, HEADLINE_MAX_WORDS, type BundlePhrases } from "./bundle";
import { structureFacts, type CitedSpan } from "./facts";
import { checkNeutrality } from "./neutrality";

/**
 * Stand-in secondary locale with ASCII markers only — it proves substitution
 * works at the seam without putting any real locale's words in the repo. The
 * production Hindi pack arrives at runtime (deploy-time locale pack).
 */
const TEST_LOCALE: BundlePhrases = {
  pressNoteLabel: "T_PRESS",
  officialStatement: "T_STATEMENT",
  officialNotice: "T_NOTICE",
  detailsAwaited: "T_AWAITED",
  participantsLabel: "T_PARTICIPANTS",
  keyOutcomeLabel: "T_KEY_OUTCOME",
  outcomesLabel: "T_OUTCOMES",
  actionTakenLabel: "T_ACTION",
  allegedOffenceIs: "T_ALLEGED_IS",
  accusedIs: "T_ACCUSED_IS",
  exactCharges: "T_CHARGES",
  investigationUnderway: "T_PROBE.",
  furtherAwaited: "T_FURTHER.",
  notConfirmed: "T_UNCONFIRMED",
  casualtiesUnconfirmed: "T_CASUALTIES_UNCONFIRMED.",
  deadWord: "T_DEAD",
  injuredWord: "T_INJURED",
  reportedPrefix: "T_REPORTED:",
  reportedAnd: "T_AND",
  reportedSuffix: "T_DONE.",
  sentenceEnd: "|",
};

const SPANS: CitedSpan[] = [
  { sourceId: "fir-12", locator: "page 1", text: "Crime No. 12 under IT Act" },
  { sourceId: "brief-3", locator: "segment 2", text: "press briefing at HQ" },
];

function wordCount(s: string): number {
  return s.split(/\s+/).filter((w) => w.length > 0).length;
}

describe("bundle module", () => {
  test("headlines fit the word cap by clause-dropping", () => {
    expect(
      wordCount(capHeadline("one two three, four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen")),
    ).toBeLessThanOrEqual(HEADLINE_MAX_WORDS);
    expect(capHeadline("short headline")).toBe("short headline");
  });

  test("full bundle renders both locales with citations and no invention", () => {
    const structured = structureFacts({
      spans: SPANS,
      claims: {
        event: [{ spanIndex: 0, value: "cyber fraud crackdown" }],
        eventShort: [{ spanIndex: 0, value: "fraud crackdown" }],
        date: [{ spanIndex: 1, value: "2026-10-12" }],
        location: [{ spanIndex: 1, value: "Jaipur" }],
        participants: [{ spanIndex: 1, value: "SP Sharma" }],
        actionTaken: [{ spanIndex: 0, value: "two arrests made" }],
        allegedCrime: [{ spanIndex: 0, value: "online fraud" }],
      },
    });
    if (!isOk(structured)) throw new Error("fixture must structure cleanly");
    const bundle = buildDraftBundle(structured.value, TEST_LOCALE);

    expect(bundle.renderedBy).toBe("template-v1");
    expect(bundle.headlinesEn).toHaveLength(3);
    for (const h of bundle.headlinesEn) expect(wordCount(h)).toBeLessThanOrEqual(HEADLINE_MAX_WORDS);
    for (const h of bundle.headlinesHi) expect(wordCount(h)).toBeLessThanOrEqual(HEADLINE_MAX_WORDS);
    expect(bundle.citedSourceIds).toEqual(expect.arrayContaining(["fir-12", "brief-3"]));
    expect(bundle.detailEn).toContain("alleged");
    // Secondary locale substitutes through the same seam, ASCII-proven.
    expect(bundle.detailHi).toContain("T_ALLEGED_IS");
    expect(bundle.summaryHi).toContain("T_PARTICIPANTS");
    expect(wordCount(bundle.summaryEn)).toBeGreaterThanOrEqual(15);
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
    const bundle = buildDraftBundle(structured.value, TEST_LOCALE);
    expect(bundle.detailEn).toContain("could not be confirmed");
    expect(bundle.detailEn).not.toMatch(/\b[0-9]+ injured were reported/);
    expect(bundle.detailHi).toContain("T_CASUALTIES_UNCONFIRMED");
  });

  test("empty facts still produce an honest awaiting-details bundle", () => {
    const structured = structureFacts({ spans: [], claims: {} });
    if (!isOk(structured)) throw new Error("fixture must structure cleanly");
    const bundle = buildDraftBundle(structured.value, TEST_LOCALE);
    expect(bundle.detailEn).toContain("awaited");
    expect(bundle.headlinesHi[1]).toContain("T_AWAITED");
    expect(bundle.summaryHi).toContain("T_UNCONFIRMED");
    expect(bundle.citedSourceIds).toEqual([]);
  });
});
