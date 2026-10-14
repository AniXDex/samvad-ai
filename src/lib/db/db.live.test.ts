/**
 * Live Postgres test — round-trip proof on an EPHEMERAL branch only.
 * Runs only when `LIVE_DB_TEST=1` with `DATABASE_URL` pointing at the scratch
 * branch (the runner script sets both). Never run against production: the test
 * writes and deletes one row. Skipped in ordinary `vitest run`.
 */
import { describe, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { isOk } from "@/lib/result/result";
import { createDb, pickConnectionString } from "./db";
import { documents } from "./schema";

const live = process.env["LIVE_DB_TEST"] === "1";

describe.skipIf(!live)("db module (live)", () => {
  test("documents round-trip through the Drizzle interface", async () => {
    const picked = pickConnectionString({ pooled: process.env["DATABASE_URL"], direct: undefined }, "app");
    if (!isOk(picked)) throw new Error("DATABASE_URL required for live test");
    const { db, close } = createDb(picked.value);
    try {
      const inserted = await db
        .insert(documents)
        .values({ tenantId: "tenant-probe", title: "probe press note" })
        .returning({ id: documents.id });
      expect(inserted).toHaveLength(1);
      const id = inserted[0]?.id;
      expect(typeof id).toBe("string");

      const read = await db.select().from(documents).where(eq(documents.id, id ?? ""));
      expect(read[0]?.title).toBe("probe press note");

      await db.delete(documents).where(eq(documents.id, id ?? ""));
      const gone = await db.select().from(documents).where(eq(documents.id, id ?? ""));
      expect(gone).toHaveLength(0);
    } finally {
      await close();
    }
  });
});
