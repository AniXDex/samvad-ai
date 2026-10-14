import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { createMistralOcrEngine } from "@/lib/ocr/mistral";
import { isOk } from "@/lib/result/result";

export const processDocumentOcr = schemaTask({
  id: "ocr-document-scan",
  schema: z.object({
    documentId: z.string().uuid(),
    tenantId: z.string().min(1),
    sourceId: z.string().min(1),
    documentUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    base64DataUrl: z.string().optional(),
  }),
  run: async (payload) => {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) {
      return {
        status: "error" as const,
        documentId: payload.documentId,
        error: "MISTRAL_API_KEY is not configured",
      };
    }

    const engine = createMistralOcrEngine({ apiKey: key });
    const result = await engine.ocr({
      documentUrl: payload.documentUrl,
      imageUrl: payload.imageUrl,
      base64DataUrl: payload.base64DataUrl,
    });

    if (!isOk(result)) {
      return {
        status: "error" as const,
        documentId: payload.documentId,
        error:
          result.error.kind === "transport" || result.error.kind === "rate-limited"
            ? result.error.message
            : result.error.kind,
      };
    }

    return {
      status: "success" as const,
      documentId: payload.documentId,
      sourceId: payload.sourceId,
      fullMarkdown: result.value.fullMarkdown,
      pageCount: result.value.pageCount,
      pages: result.value.pages,
      model: result.value.model,
      processedAt: new Date().toISOString(),
    };
  },
});
