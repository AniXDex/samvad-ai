/**
 * Live Laya test — one tiny Noul call (~dozens of free tokens).
 * Runs only when LAYA_API_KEY is present; asserts wiring shape only
 * (numbers in range), never the model's judgment.
 */
import { describe, expect, test } from "vitest";
import { isOk } from "@/lib/result/result";
import { createLayaVerifier } from "./verify";

const key = process.env["LAYA_API_KEY"];

describe.skipIf(!key)("verify module (live)", () => {
  test("noul verdict returns numbers in range", async () => {
    if (!key) throw new Error("LAYA_API_KEY required for live test");
    const verifier = createLayaVerifier({ baseUrl: "https://api.laya.studio", apiKey: key });
    const result = await verifier.verifyNoul({
      state: "The meeting is on Monday at the district office.",
      checks: [{ id: "mentions-day", instructions: "Does the text mention a day of the week?" }],
    });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const verdict = result.value[0];
      expect(verdict?.id).toBe("mentions-day");
      expect(verdict?.probabilityTrue).toBeGreaterThanOrEqual(0);
      expect(verdict?.probabilityTrue).toBeLessThanOrEqual(1);
      expect(verdict?.confidence).toBeGreaterThanOrEqual(0);
      expect(verdict?.confidence).toBeLessThanOrEqual(1);
    }
  });
});
