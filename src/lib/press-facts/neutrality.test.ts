import { describe, expect, test } from "vitest";
import { checkNeutrality } from "./neutrality";

describe("neutrality module", () => {
  test("clean procedural text raises no flags", () => {
    expect(checkNeutrality("The accused is under investigation. Further details are awaited.")).toEqual([]);
  });

  test("presumption of guilt is flagged with its span", () => {
    const flags = checkNeutrality("The guilty kingpin has confessed.");
    expect(flags.map((f) => f.rule)).toEqual(["presumption-of-guilt", "presumption-of-guilt", "presumption-of-guilt"]);
    expect(flags[0]?.index).toBeGreaterThanOrEqual(0);
  });

  test("sensational and unverified-scale phrasing is flagged", () => {
    expect(checkNeutrality("A shocking scandal busted.").map((f) => f.rule)).toContain("sensational");
    expect(checkNeutrality("At least 5 crores siphoned.").map((f) => f.rule)).toContain("unverified-scale");
  });

  test("deployments can extend the lexicon without code changes", () => {
    const flags = checkNeutrality("This is utterly kerfuffled.", [
      { rule: "sensational", patterns: [/\bkerfuffled\b/i] },
    ]);
    expect(flags).toHaveLength(1);
    expect(checkNeutrality("This is utterly kerfuffled.")).toEqual([]);
  });
});
