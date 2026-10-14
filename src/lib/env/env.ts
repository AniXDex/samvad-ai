/**
 * env module — typed environment loading (in-process dependency).
 *
 * Interface: {@link loadEnv}. Callers pass a plain string map (production
 * passes `process.env` at the outermost layer) and get either a validated
 * {@link Env} or every problem at once as {@link EnvIssue[]}. The module never
 * reads `process.env` itself, so tests exercise the same seam as production
 * with zero setup. Error mode: missing key vs blank value are distinguished
 * so operators get an actionable message, never a bare crash.
 */
import { err, ok, type Result } from "@/lib/result/result";

export interface Env {
  readonly cloudflareAccountId: string;
  readonly cloudflareApiToken: string;
  readonly r2AccessKeyId: string;
  readonly r2SecretAccessKey: string;
  readonly r2S3Endpoint: string;
}

export type EnvSource = Record<string, string | undefined>;

export interface EnvIssue {
  readonly key: string;
  readonly reason: "missing" | "blank";
}

const REQUIRED_KEYS = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_S3_ENDPOINT",
] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];

function readKey(source: EnvSource, key: RequiredKey): EnvIssue | string {
  const raw = source[key];
  if (raw === undefined) return { key, reason: "missing" };
  if (raw.trim().length === 0) return { key, reason: "blank" };
  return raw;
}

export function loadEnv(source: EnvSource): Result<Env, EnvIssue[]> {
  const issues: EnvIssue[] = [];
  const values: Record<string, string> = {};

  for (const key of REQUIRED_KEYS) {
    const found = readKey(source, key);
    if (typeof found === "string") values[key] = found;
    else issues.push(found);
  }

  if (issues.length > 0) return err(issues);

  const env: Env = {
    cloudflareAccountId: values["CLOUDFLARE_ACCOUNT_ID"] ?? "",
    cloudflareApiToken: values["CLOUDFLARE_API_TOKEN"] ?? "",
    r2AccessKeyId: values["R2_ACCESS_KEY_ID"] ?? "",
    r2SecretAccessKey: values["R2_SECRET_ACCESS_KEY"] ?? "",
    r2S3Endpoint: values["R2_S3_ENDPOINT"] ?? "",
  };
  return ok(env);
}
