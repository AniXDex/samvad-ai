import { describe, expect, test } from "vitest";
import { isErr, isOk } from "@/lib/result/result";
import { resolveAuthConfig } from "./config";

describe("auth-config module", () => {
  test("valid settings resolve", () => {
    const result = resolveAuthConfig({ baseUrl: "https://auth.example/branch", cookieSecret: "s" });
    expect(isOk(result)).toBe(true);
  });

  test("missing settings fail fast naming the variable", () => {
    const noUrl = resolveAuthConfig({ baseUrl: undefined, cookieSecret: "s" });
    expect(isErr(noUrl)).toBe(true);
    if (isErr(noUrl)) expect(noUrl.error).toContain("NEON_AUTH_BASE_URL");

    const noSecret = resolveAuthConfig({ baseUrl: "https://auth.example/branch", cookieSecret: undefined });
    expect(isErr(noSecret)).toBe(true);
    if (isErr(noSecret)) expect(noSecret.error).toContain("NEON_AUTH_COOKIE_SECRET");
  });
});
