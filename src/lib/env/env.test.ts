import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { loadEnv, type EnvIssue, type EnvSource } from "./env";

const VALID: EnvSource = {
  CLOUDFLARE_ACCOUNT_ID: "account-1",
  CLOUDFLARE_API_TOKEN: "token-1",
  R2_ACCESS_KEY_ID: "key-1",
  R2_SECRET_ACCESS_KEY: "secret-1",
  R2_S3_ENDPOINT: "https://account-1.r2.cloudflarestorage.com",
};

describe("env module", () => {
  test("valid source loads a typed Env", () => {
    const result = loadEnv(VALID);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.r2S3Endpoint).toBe("https://account-1.r2.cloudflarestorage.com");
      expect(result.value.cloudflareAccountId).toBe("account-1");
    }
  });

  test("every missing key is reported at once", () => {
    const result = loadEnv({});
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toHaveLength(5);
      expect(result.error.map((i: EnvIssue) => i.reason)).toEqual(["missing", "missing", "missing", "missing", "missing"]);
    }
  });

  test("blank values are distinguished from missing ones", () => {
    const result = loadEnv({ ...VALID, R2_SECRET_ACCESS_KEY: "   " });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toEqual([{ key: "R2_SECRET_ACCESS_KEY", reason: "blank" }]);
    }
  });

  test("extra keys are ignored", () => {
    const result = loadEnv({ ...VALID, WHATEVER: "x" });
    expect(isOk(result)).toBe(true);
  });
});
