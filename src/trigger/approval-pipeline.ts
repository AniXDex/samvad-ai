import { schemaTask, wait } from "@trigger.dev/sdk";
import { z } from "zod";

interface ApprovalTokenOutput {
  status: "approved" | "rejected";
  approvedBy: string;
  attestationConfirmed: boolean;
}

export const pressNoteApprovalPipeline = schemaTask({
  id: "press-note-approval-pipeline",
  schema: z.object({
    documentId: z.string().uuid(),
    tenantId: z.string().min(1),
    timeout: z.string().default("7d"),
  }),
  run: async (payload) => {
    // 1. Create a durable human-in-the-loop waitpoint token
    const token = await wait.createToken({
      timeout: payload.timeout,
      tags: [`doc:${payload.documentId}`, `tenant:${payload.tenantId}`],
    });

    // 2. Pause execution until the authorized officer approves in the review editor
    const result = await wait.forToken<ApprovalTokenOutput>(token.id);

    if (!result.ok) {
      // Timeout: escalate, never auto-publish
      return {
        status: "escalated" as const,
        documentId: payload.documentId,
        reason: "Approval window timed out without officer sign-off; escalated to supervisory queue",
      };
    }

    if (result.output.status !== "approved" || !result.output.attestationConfirmed) {
      return {
        status: "rejected" as const,
        documentId: payload.documentId,
        rejectedBy: result.output.approvedBy,
      };
    }

    return {
      status: "approved" as const,
      documentId: payload.documentId,
      approvedBy: result.output.approvedBy,
      approvedAt: new Date().toISOString(),
    };
  },
});
