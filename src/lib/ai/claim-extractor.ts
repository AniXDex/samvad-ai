/**
 * claim-extractor module — AI claim extraction seam (SKIT005 bullet 1).
 *
 * Interface: {@link ClaimExtractor} with method `extractClaims`. Callers submit
 * raw source text (from an FIR, incident report, or transcript) and get back
 * {@link ExtractionOutput}: an array of {@link CitedSpan}s and a dictionary of
 * {@link Claim}s by field name, ready for deterministic ingestion by
 * {@link structureFacts}.
 *
 * Deep module design:
 * - Inputs validated before any network call.
 * - Injected transport (`post`), so tests run with zero network calls.
 * - Fake adapter {@link createFakeClaimExtractor} for deterministic unit testing.
 * - Strict type-safety: zero `any`, returns `Result<ExtractionOutput, ExtractionFailure>`.
 */
import type { CitedSpan, Claim } from "@/lib/press-facts/facts";
import { err, ok, type Result } from "@/lib/result/result";

export interface ExtractionOutput {
  readonly spans: readonly CitedSpan[];
  readonly claims: Readonly<Record<string, readonly Claim[]>>;
}

export type ExtractionFailure =
  | { readonly kind: "invalid-input"; readonly issues: readonly string[] }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "parse-error"; readonly message: string }
  | { readonly kind: "transport"; readonly message: string };

export interface ExtractionInput {
  readonly sourceId: string;
  readonly text: string;
}

export interface ClaimExtractor {
  extractClaims(input: ExtractionInput): Promise<Result<ExtractionOutput, ExtractionFailure>>;
}

export interface LlmConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly maxChars?: number;
  readonly post?: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}

export const DEFAULT_MAX_EXTRACTION_CHARS = 10_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const SYSTEM_PROMPT = `You are a sovereign legal press assistant. Extract key facts from the police report / FIR text into structured JSON.
Return JSON with two keys:
1. "spans": array of { "locator": string (e.g. "para-1" or "line-3"), "text": exact quote from text }
2. "claims": object with keys:
   - "event": array of { "spanIndex": number | null, "value": string }
   - "eventShort": array of { "spanIndex": number | null, "value": string }
   - "date": array of { "spanIndex": number | null, "value": string }
   - "time": array of { "spanIndex": number | null, "value": string }
   - "location": array of { "spanIndex": number | null, "value": string }
   - "dead": array of { "spanIndex": number | null, "value": string }
   - "injured": array of { "spanIndex": number | null, "value": string }
   - "allegedCrime": array of { "spanIndex": number | null, "value": string }
   - "accused": array of { "spanIndex": number | null, "value": string }
   - "actionTaken": array of { "spanIndex": number | null, "value": string }
   - "participants": array of { "spanIndex": number | null, "value": string }
   - "outcomes": array of { "spanIndex": number | null, "value": string }

Rules:
- NEVER invent facts not present in the text.
- If a fact is unstated, provide an empty array for that field.
- If multiple values conflict, include both claims with their respective spanIndex.`;

function parseExtractionJson(rawText: string, sourceId: string): Result<ExtractionOutput, string> {
  let parsed: unknown;
  try {
    // Strip markdown code fences if model wrapped response in ```json ... ```
    const cleaned = rawText.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/gi, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e: unknown) {
    return err(`failed to parse JSON from LLM: ${e instanceof Error ? e.message : "unknown syntax error"}`);
  }

  if (!isRecord(parsed)) return err("LLM response was not a JSON object");

  const rawSpans = parsed["spans"];
  if (!Array.isArray(rawSpans)) return err("spans field is not an array");

  const spans: CitedSpan[] = [];
  for (const s of rawSpans) {
    if (!isRecord(s)) return err("invalid span element in spans array");
    const locator = typeof s["locator"] === "string" ? s["locator"] : "unknown";
    const text = typeof s["text"] === "string" ? s["text"] : "";
    spans.push({ sourceId, locator, text });
  }

  const rawClaims = parsed["claims"];
  if (!isRecord(rawClaims)) return err("claims field is not a JSON object");

  const claims: Record<string, Claim[]> = {};
  for (const [key, val] of Object.entries(rawClaims)) {
    if (!Array.isArray(val)) continue;
    const fieldClaims: Claim[] = [];
    for (const c of val) {
      if (!isRecord(c)) continue;
      const valStr = typeof c["value"] === "string" ? c["value"] : "";
      const rawSpanIdx = c["spanIndex"];
      const spanIndex = typeof rawSpanIdx === "number" && rawSpanIdx >= 0 && rawSpanIdx < spans.length ? rawSpanIdx : null;
      fieldClaims.push({ spanIndex, value: valStr });
    }
    claims[key] = fieldClaims;
  }

  return ok({ spans, claims });
}

async function defaultPost(url: string, apiKey: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    const failure: ExtractionFailure = { kind: "unauthorized" };
    throw failure;
  }

  if (!response.ok) {
    const failure: ExtractionFailure = {
      kind: "transport",
      message: `endpoint returned HTTP ${response.status}`,
    };
    throw failure;
  }

  return (await response.json()) as unknown;
}

export function createLlmClaimExtractor(config: LlmConfig): ClaimExtractor {
  const maxChars = config.maxChars ?? DEFAULT_MAX_EXTRACTION_CHARS;

  return {
    async extractClaims(input: ExtractionInput): Promise<Result<ExtractionOutput, ExtractionFailure>> {
      const issues: string[] = [];
      if (!input.sourceId.trim()) issues.push("sourceId is required");
      if (!input.text.trim()) issues.push("text is required");
      if (input.text.length > maxChars) {
        issues.push(`text length (${input.text.length}) exceeds budget (${maxChars})`);
      }
      if (issues.length > 0) return err({ kind: "invalid-input", issues });

      const requestBody: Record<string, unknown> = {
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Source ID: ${input.sourceId}\n\nEvidence Text:\n${input.text}` },
        ],
        temperature: 0.1,
      };

      const url = `${config.baseUrl.replace(/\/+$/, "")}/chat/completions`;
      let rawResponse: unknown;

      try {
        rawResponse = config.post
          ? await config.post(url, requestBody)
          : await defaultPost(url, config.apiKey, requestBody);
      } catch (error: unknown) {
        if (isRecord(error) && (error["kind"] === "unauthorized" || error["kind"] === "transport")) {
          return err(error as ExtractionFailure);
        }
        return err({
          kind: "transport",
          message: error instanceof Error ? error.message : "unknown network failure",
        });
      }

      if (!isRecord(rawResponse)) {
        return err({ kind: "parse-error", message: "API response was not an object" });
      }

      const choices = rawResponse["choices"];
      if (!Array.isArray(choices) || choices.length === 0) {
        return err({ kind: "parse-error", message: "choices array missing or empty in response" });
      }

      const firstChoice = choices[0];
      if (!isRecord(firstChoice)) {
        return err({ kind: "parse-error", message: "first choice is invalid" });
      }

      const message = firstChoice["message"];
      if (!isRecord(message) || typeof message["content"] !== "string") {
        return err({ kind: "parse-error", message: "message content missing" });
      }

      const parsed = parseExtractionJson(message["content"], input.sourceId);
      if (parsed.status === "error") {
        return err({ kind: "parse-error", message: parsed.error });
      }

      return ok(parsed.value);
    },
  };
}

/** In-memory fake claim extractor for deterministic unit tests. */
export function createFakeClaimExtractor(
  preset: ExtractionOutput | ((input: ExtractionInput) => Result<ExtractionOutput, ExtractionFailure>)
): ClaimExtractor {
  return {
    async extractClaims(input: ExtractionInput): Promise<Result<ExtractionOutput, ExtractionFailure>> {
      if (!input.sourceId.trim() || !input.text.trim()) {
        return err({ kind: "invalid-input", issues: ["sourceId and text required"] });
      }
      if (typeof preset === "function") {
        return preset(input);
      }
      return ok(preset);
    },
  };
}
