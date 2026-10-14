/**
 * session module — Clerk session mapping (in-process).
 *
 * Interface: {@link resolveSession}. It narrows the unknown Clerk payload
 * to the router's `Session` shape; anything malformed becomes null,
 * never a throw. Framework-free, so it is unit tested directly; the Next-bound
 * fetching stays in `context.ts`, verified by live HTTP.
 */
import type { Session } from "@/server/trpc";

export function resolveSession(data: unknown): Session | null {
  if (typeof data !== "object" || data === null) return null;
  const user: unknown = (data as { user?: unknown }).user;
  if (typeof user !== "object" || user === null) return null;
  const id: unknown = (user as { id?: unknown }).id;
  if (typeof id !== "string" || id.length === 0) return null;
  return { user: { id } };
}

