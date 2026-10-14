import { describe, expect, test } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { isErr, isOk } from "@/lib/result/result";
import { pickConnectionString } from "./db";
import { documents, sources } from "./schema";

describe("db module", () => {
  test("app traffic takes the pooled URL", () => {
    const result = pickConnectionString({ pooled: "pooled-url", direct: "direct-url" }, "app");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toBe("pooled-url");
  });

  test("migrations take the direct URL, never the pooler", () => {
    const result = pickConnectionString({ pooled: "pooled-url", direct: "direct-url" }, "migrate");
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe("direct-url");
      expect(result.value).not.toContain("-pooler");
    }
  });

  test("missing or blank URLs fail with the variable name", () => {
    const missing = pickConnectionString({ pooled: undefined, direct: "d" }, "app");
    expect(isErr(missing)).toBe(true);
    if (isErr(missing)) expect(missing.error).toContain("DATABASE_URL");

    const blank = pickConnectionString({ pooled: "p", direct: "  " }, "migrate");
    expect(isErr(blank)).toBe(true);
    if (isErr(blank)) expect(blank.error).toContain("DATABASE_URL_UNPOOLED");
  });

  test("schema exposes the ingest contract tables", () => {
    expect(getTableConfig(documents).name).toBe("documents");
    expect(getTableConfig(sources).name).toBe("sources");
    const sourceColumns = getTableConfig(sources).columns.map((c) => c.name);
    expect(sourceColumns).toContain("r2_key");
    expect(sourceColumns).toContain("sha256");
  });
});
