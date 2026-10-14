/**
 * auth-config module — Managed Auth settings (in-process).
 *
 * Interface: {@link resolveAuthConfig}. It validates the two values Managed
 * Auth needs and fails fast naming the variable. It imports nothing
 * Next-bound, so tests cross this seam with zero framework setup; the SDK
 * wiring lives in `server.ts`, which is verified by build + live HTTP.
 */
import { err, ok, type Result } from "@/lib/result/result";

export interface AuthServerConfig {
  readonly baseUrl: string;
  readonly cookieSecret: string;
}

export function resolveAuthConfig(source: {
  baseUrl: string | undefined;
  cookieSecret: string | undefined;
}): Result<AuthServerConfig, string> {
  if (!source.baseUrl) return err("NEON_AUTH_BASE_URL is required to create the auth server");
  if (!source.cookieSecret) return err("NEON_AUTH_COOKIE_SECRET is required to create the auth server");
  return ok({ baseUrl: source.baseUrl, cookieSecret: source.cookieSecret });
}
