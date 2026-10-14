/**
 * db module — Postgres connection seam (pooled vs direct).
 *
 * Interface: {@link pickConnectionString} (pure: which URL for which purpose)
 * and {@link createDb} (wires a `pg` pool into Drizzle). The connection string
 * is injected — the module never reads `process.env` — so tests cross the same
 * seam as production. Rule, per the neon-postgres skill: pooled `DATABASE_URL`
 * for app traffic, direct `DATABASE_URL_UNPOOLED` for migrations. Callers that
 * need anything else (LISTEN/NOTIFY, dumps) take the direct URL explicitly.
 */
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { err, ok, type Result } from "@/lib/result/result";
import * as schema from "./schema";

export type ConnectionPurpose = "app" | "migrate";

export interface ConnectionStrings {
  readonly pooled: string | undefined;
  readonly direct: string | undefined;
}

export function pickConnectionString(
  strings: ConnectionStrings,
  purpose: ConnectionPurpose,
): Result<string, string> {
  const candidate = purpose === "app" ? strings.pooled : strings.direct;
  if (candidate === undefined || candidate.trim().length === 0) {
    const name = purpose === "app" ? "DATABASE_URL" : "DATABASE_URL_UNPOOLED";
    return err(`${name} is required for ${purpose} connections`);
  }
  return ok(candidate);
}

export interface Database {
  readonly db: NodePgDatabase<typeof schema>;
  readonly close: () => Promise<void>;
}

export function createDb(connectionString: string): Database {
  const pool = new Pool({ connectionString, max: 5 });
  const db = drizzle(pool, { schema });
  return {
    db,
    close: () => pool.end(),
  };
}
