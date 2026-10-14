import { task } from "@trigger.dev/sdk";

export const smokeCheck = task({
  id: "smoke-check",
  run: async (payload: { message?: string }) => {
    return {
      status: "ok",
      service: "samvaad-ai",
      timestamp: new Date().toISOString(),
      echo: payload.message ?? "Trigger.dev pipeline verified",
    };
  },
});
