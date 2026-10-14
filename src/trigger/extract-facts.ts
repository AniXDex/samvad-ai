import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { structureFacts, type CitedSpan, type Claim } from "@/lib/press-facts/facts";
import { checkNeutrality } from "@/lib/press-facts/neutrality";
import { buildDraftBundle, ENGLISH_PHRASES } from "@/lib/press-facts/bundle";
import { isOk } from "@/lib/result/result";
import { createLlmClaimExtractor } from "@/lib/ai/claim-extractor";

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
    spans: z.array(citedSpanSchema).default([]),
    claims: z.record(z.string(), z.array(claimSchema)).default({}),
    rawIncidentText: z.string().default(""),
    sourceId: z.string().default("source-primary"),
  }),
  run: async (payload) => {
    let activeSpans: readonly CitedSpan[] = payload.spans;
    let activeClaims: Readonly<Record<string, readonly Claim[]>> = payload.claims;

    // 1. If raw incident text provided and claims are empty, extract using LLM extractor
    if (payload.rawIncidentText && activeSpans.length === 0 && Object.keys(activeClaims).length === 0) {
      const apiKey = process.env.LITELLM_API_KEY || process.env.MISTRAL_API_KEY || "";
      const baseUrl = process.env.LITELLM_BASE_URL || "https://llm.corsair.dev/v1";
      const model = process.env.LITELLM_MODEL || "gpt-5.4-mini";

      if (apiKey) {
        const extractor = createLlmClaimExtractor({ apiKey, baseUrl, model });
        const extractionRes = await extractor.extractClaims({
          sourceId: payload.sourceId,
          text: payload.rawIncidentText,
        });
        if (isOk(extractionRes)) {
          activeSpans = extractionRes.value.spans;
          activeClaims = extractionRes.value.claims;
        }
      }
    }

    // 2. Structure the facts deterministically from citations
    const structuredResult = structureFacts({
      spans: activeSpans,
      claims: activeClaims,
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
