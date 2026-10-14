/**
 * Inngest functions — event handlers and fan-out orchestrator.
 *
 * When an upload completes (`upload/complete` event), validates file kind
 * and dispatches durable processing to Trigger.dev (audio transcription
 * or OCR document scanning) with full step memoization and crash safety.
 */
import { tasks } from "@trigger.dev/sdk";
import type { processDocumentOcr } from "@/trigger/ocr-document";
import type { transcribeAudioBriefing } from "@/trigger/transcribe-audio";
import { inngest } from "./client";

export interface UploadCompletePayload {
  readonly documentId: string;
  readonly tenantId: string;
  readonly sourceId: string;
  readonly kind: "form" | "pdf" | "image" | "audio";
  readonly r2Key?: string;
  readonly fileUrl?: string;
  readonly audioBase64?: string;
  readonly base64DataUrl?: string;
}

export function parseUploadPayload(data: unknown): UploadCompletePayload | null {
  if (typeof data !== "object" || data === null) return null;
  const obj = data as Record<string, unknown>;
  if (
    typeof obj["documentId"] !== "string" ||
    typeof obj["tenantId"] !== "string" ||
    typeof obj["sourceId"] !== "string" ||
    typeof obj["kind"] !== "string"
  ) {
    return null;
  }
  const kind = obj["kind"];
  if (kind !== "form" && kind !== "pdf" && kind !== "image" && kind !== "audio") {
    return null;
  }
  return {
    documentId: obj["documentId"],
    tenantId: obj["tenantId"],
    sourceId: obj["sourceId"],
    kind,
    r2Key: typeof obj["r2Key"] === "string" ? obj["r2Key"] : undefined,
    fileUrl: typeof obj["fileUrl"] === "string" ? obj["fileUrl"] : undefined,
    audioBase64: typeof obj["audioBase64"] === "string" ? obj["audioBase64"] : undefined,
    base64DataUrl: typeof obj["base64DataUrl"] === "string" ? obj["base64DataUrl"] : undefined,
  };
}

export const uploadComplete = inngest.createFunction(
  { id: "upload-complete", triggers: [{ event: "upload/complete" }] },
  async ({ event, step }) => {
    const payloadResult = await step.run("validate-upload-metadata", () => {
      const parsed = parseUploadPayload(event.data);
      if (!parsed) {
        return { valid: false as const, error: "Malformed upload payload" };
      }
      return { valid: true as const, payload: parsed };
    });

    if (!payloadResult.valid) {
      return { status: "rejected", error: payloadResult.error };
    }

    const { kind, documentId, tenantId, sourceId, audioBase64, fileUrl, base64DataUrl } =
      payloadResult.payload;

    if (kind === "audio") {
      const dispatch = await step.run("dispatch-audio-transcription", async () => {
        if (!process.env.TRIGGER_SECRET_KEY) {
          return { dispatched: false, reason: "TRIGGER_SECRET_KEY is not configured" };
        }
        const run = await tasks.trigger<typeof transcribeAudioBriefing>(
          "transcribe-audio-briefing",
          {
            documentId,
            tenantId,
            sourceId,
            audioBase64: audioBase64 ?? "",
          },
        );
        return { dispatched: true, runId: run.id };
      });
      return { status: "success", target: "transcribe-audio-briefing", dispatch };
    }

    if (kind === "pdf" || kind === "image") {
      const dispatch = await step.run("dispatch-document-ocr", async () => {
        if (!process.env.TRIGGER_SECRET_KEY) {
          return { dispatched: false, reason: "TRIGGER_SECRET_KEY is not configured" };
        }
        const run = await tasks.trigger<typeof processDocumentOcr>("ocr-document-scan", {
          documentId,
          tenantId,
          sourceId,
          documentUrl: fileUrl,
          base64DataUrl,
        });
        return { dispatched: true, runId: run.id };
      });
      return { status: "success", target: "ocr-document-scan", dispatch };
    }

    return { status: "success", target: "manual-form-recorded", documentId };
  },
);

export const functions = [uploadComplete];
