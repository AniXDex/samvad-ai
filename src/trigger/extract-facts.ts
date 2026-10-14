import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { structureFacts } from "@/lib/press-facts/facts";
import { checkNeutrality } from "@/lib/press-facts/neutrality";
import { buildDraftBundle, ENGLISH_PHRASES } from "@/lib/press-facts/bundle";
import { isOk } from "@/lib/result/result";

const citedSpanSchema = z.object({
  sourceId: z.string().min(1),
  locator: z.string().min(1),
  text: z.string().min(1),
});

const claimSchema = z.object({
  spanIndex: z.number().int().nullable(),
  value: z.string(),
});

export const extractPressFacts = schemaTask({
  id: "extract-press-facts",
  schema: z.object({
    documentId: z.string().uuid(),
    tenantId: z.string().min(1),
    spans: z.array(citedSpanSchema),
    claims: z.record(z.string(), z.array(claimSchema)),
    rawIncidentText: z.string().default(""),
  }),
  run: async (payload) => {
    // 1. Structure the facts deterministically from citations
    const structuredResult = structureFacts({
      spans: payload.spans,
      claims: payload.claims,
    });

    if (!isOk(structuredResult)) {
      return {
        status: "error" as const,
        documentId: payload.documentId,
        errors: structuredResult.error,
      };
    }

    const facts = structuredResult.value;

    // 2. Run neutrality and guilt pre-screening check
    const flags = checkNeutrality(payload.rawIncidentText);

    // 3. Render draft bundle (English primary + phrases)
    const bundle = buildDraftBundle(facts, ENGLISH_PHRASES);

    return {
      status: "success" as const,
      documentId: payload.documentId,
      tenantId: payload.tenantId,
      facts,
      neutrality: {
        flagCount: flags.length,
        flags,
      },
      bundle: {
        headlines: bundle.headlinesPrimary,
        summary: bundle.summaryPrimary,
        detail: bundle.detailPrimary,
        citedSourceIds: bundle.citedSourceIds,
      },
      processedAt: new Date().toISOString(),
    };
  },
});
