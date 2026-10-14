/**
 * auth-server wiring — Managed Better Auth instance (Next-bound leaf).
 *
 * This file is intentionally thin: settings validated by `config.ts`
 * (unit tested), SDK call per the neon-auth skill. It is verified by
 * `next build` + live HTTP against `/api/auth/ok`, not by unit tests —
 * importing the Managed SDK outside Next has no meaning. Do not import this
 * file from unit tests.
 */
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { isErr } from "@/lib/result/result";
import { resolveAuthConfig } from "./config";

const resolved = resolveAuthConfig({
  baseUrl: process.env.NEON_AUTH_BASE_URL,
  cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET,
});

if (isErr(resolved)) throw new Error(resolved.error);

export const auth = createNeonAuth({
  baseUrl: resolved.value.baseUrl,
  cookies: { secret: resolved.value.cookieSecret },
});
