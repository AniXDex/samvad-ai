import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { createSarvamTranscriber } from "@/lib/stt/sarvam";
import { isOk } from "@/lib/result/result";

export const transcribeAudioBriefing = schemaTask({
  id: "transcribe-audio-briefing",
  schema: z.object({
    documentId: z.string().uuid(),
    tenantId: z.string().min(1),
    sourceId: z.string().min(1),
    audioBase64: z.string().min(1),
    fileName: z.string().default("briefing.wav"),
    mode: z.enum(["transcribe", "codemix", "translate", "verbatim", "translit"]).default("codemix"),
  }),
  run: async (payload) => {
    const key = process.env.SARVAM_API_KEY;
    if (!key) {
      return {
        status: "error" as const,
        documentId: payload.documentId,
        error: "SARVAM_API_KEY is not configured",
      };
    }

    const transcriber = createSarvamTranscriber({ apiKey: key });
    const buffer = Buffer.from(payload.audioBase64, "base64");
    const audioBytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const result = await transcriber.transcribe({
      audioBytes,
      fileName: payload.fileName,
      mode: payload.mode,
    });

    if (!isOk(result)) {
      return {
        status: "error" as const,
        documentId: payload.documentId,
        error: result.error.kind === "transport" ? result.error.message : result.error.kind,
      };
    }

    return {
      status: "success" as const,
      documentId: payload.documentId,
      sourceId: payload.sourceId,
      transcript: result.value.transcript,
      languageCode: result.value.languageCode,
      processedAt: new Date().toISOString(),
    };
  },
});
