/**
 * Inngest functions — event handlers. Written against the installed SDK
 * (inngest 4.x, two-argument `createFunction`; the project skill's three-arg
 * form predates it). First function proves the dev loop; domain handlers
 * (upload.complete → Trigger fan-out) arrive with feat 5+.
 */
import { inngest } from "./client";

function documentIdOf(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const id: unknown = (data as { documentId?: unknown }).documentId;
  return typeof id === "string" ? id : null;
}

export const uploadComplete = inngest.createFunction(
  { id: "upload-complete", triggers: [{ event: "upload/complete" }] },
  async ({ event }) => {
    return { received: true, documentId: documentIdOf(event.data) };
  },
);

export const functions = [uploadComplete];
