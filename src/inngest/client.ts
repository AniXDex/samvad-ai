/**
 * Inngest client — event bus wiring (dev: INNGEST_DEV=1, no keys needed).
 * App id is the seam-stable slug; never change it (Inngest treats a rename
 * as a new app). Keys come from env only in production; never hardcode
 * `isDev` — v4 reads INNGEST_DEV.
 */
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "samvaad-ai" });
