/**
 * verify module — typed-judgment seam over Laya Studio (Jev-wire-compatible).
 *
 * Interface: {@link FactVerifier} with one method, `verifyNoul`. Callers pass
 * a state (the text to judge) plus atomic yes/no checks and get back
 * P(true) + confidence per check. The module decides nothing — thresholds
 * live with the caller (Laya docs: confidence must be calibrated per task on
 * your own labelled data; raw values rank, they don't certify).
 *
 * Wire facts, straight from laya.studio/docs: POST `{baseUrl}/v1/systemone`
 * with `{state, questions, model?}` (≤32 questions); answers arrive under the
 * same ids. Only the first ~512 (English) / ~1024 (multilingual) tokens per
 * question are read, so oversize states are rejected with `invalid-input`
 * instead of silently truncated — the caller trims decisive-first. Transport
 * is injected (`post`), so tests cross the same seam with a fake while
 * production uses fetch. Failures are a union, never throws, never `any`.
 */
import { err, ok, type Result } from "@/lib/result/result";

export const LAYA_DEFAULT_BASE_URL = "https://api.laya.studio";
export const LAYA_MAX_QUESTIONS = 32;
/** Rough char budget ≈ 512 English tokens; multilingual callers pass more. */
export const LAYA_DEFAULT_MAX_STATE_CHARS = 2000;

export interface NoulCheck {
  readonly id: string;
  readonly instructions: string;
  readonly trueMeaning?: string;
  readonly falseMeaning?: string;
}

export interface VerifyInput {
  readonly state: string;
  readonly checks: readonly NoulCheck[];
  readonly model?: "english" | "multilingual";
  readonly lang?: string;
}

export interface NoulVerdict {
  readonly id: string;
  readonly probabilityTrue: number;
  readonly confidence: number;
}

export type VerifyFailure =
  | { readonly kind: "invalid-input"; readonly issues: readonly string[] }
  | { readonly kind: "unauthorized" }
  | { readonly kind: "transport"; readonly message: string };

export interface FactVerifier {
  verifyNoul(input: VerifyInput): Promise<Result<readonly NoulVerdict[], VerifyFailure>>;
}

export interface LayaConnection {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly maxStateChars?: number;
  readonly post?: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function defaultPost(url: string, apiKey: string, body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (response.status === 401 || response.status === 403) {
    const failure: VerifyFailure = { kind: "unauthorized" };
    throw failure;
  }
  if (!response.ok) throw { kind: "transport", message: `laya responded ${response.status}` } satisfies VerifyFailure;
  return (await response.json()) as unknown;
}

function isVerifyFailure(error: unknown): error is VerifyFailure {
  if (!isRecord(error)) return false;
  if (error["kind"] === "unauthorized") return true;
  return error["kind"] === "transport" && typeof error["message"] === "string";
}

function readVerdicts(payload: unknown, ids: readonly string[]): Result<readonly NoulVerdict[], string> {
  if (!isRecord(payload)) return err("response was not an object");
  const answers: unknown = payload["answers"];
  if (!isRecord(answers)) return err("response had no answers map");
  const verdicts: NoulVerdict[] = [];
  for (const id of ids) {
    const answer: unknown = answers[id];
    if (!isRecord(answer)) return err(`answer ${JSON.stringify(id)} missing`);
    const probabilityTrue = toNumber(answer["noul"]);
    const confidence = toNumber(answer["confidence"]);
    if (probabilityTrue === null || confidence === null) {
      return err(`answer ${JSON.stringify(id)} lacked noul/confidence numbers`);
    }
    verdicts.push({ id, probabilityTrue, confidence });
  }
  return ok(verdicts);
}

export function createLayaVerifier(connection: LayaConnection): FactVerifier {
  const maxStateChars = connection.maxStateChars ?? LAYA_DEFAULT_MAX_STATE_CHARS;
  return {
    async verifyNoul(input: VerifyInput): Promise<Result<readonly NoulVerdict[], VerifyFailure>> {
      const issues: string[] = [];
      if (input.checks.length === 0) issues.push("at least one check is required");
      if (input.checks.length > LAYA_MAX_QUESTIONS) {
        issues.push(`at most ${LAYA_MAX_QUESTIONS} checks per request`);
      }
      if (input.state.length > maxStateChars) {
        issues.push(
          `state is ${input.state.length} chars, over the ${maxStateChars} budget — trim decisive-first instead of silent truncation`,
        );
      }
      const ids = input.checks.map((c) => c.id);
      if (new Set(ids).size !== ids.length) issues.push("check ids must be unique");
      if (issues.length > 0) return err({ kind: "invalid-input", issues });

      const questions: Record<string, Record<string, unknown>> = {};
      for (const check of input.checks) {
        const definition: Record<string, unknown> = { type: "noul", instructions: check.instructions };
        if (check.trueMeaning !== undefined || check.falseMeaning !== undefined) {
          definition["criteria"] = { true: check.trueMeaning ?? "", false: check.falseMeaning ?? "" };
        }
        questions[check.id] = definition;
      }
      const body: Record<string, unknown> = { state: input.state, questions: questions };
      if (input.model !== undefined) body["model"] = input.model;
      if (input.lang !== undefined) body["lang"] = input.lang;

      let payload: unknown;
      try {
        payload = connection.post
          ? await connection.post(`${connection.baseUrl}/v1/systemone`, body)
          : await defaultPost(`${connection.baseUrl}/v1/systemone`, connection.apiKey, body);
      } catch (error: unknown) {
        if (isVerifyFailure(error)) return err(error);
        return err({ kind: "transport", message: error instanceof Error ? error.message : "unknown transport error" });
      }

      const verdicts = readVerdicts(payload, ids);
      if (verdicts.status === "error") return err({ kind: "transport", message: verdicts.error });
      return ok(verdicts.value);
    },
  };
}

/** Fake verifier for tests: answers from a table, no network. Internal seam. */
export function createFakeVerifier(table: Record<string, { probabilityTrue: number; confidence: number }>): FactVerifier {
  return {
    async verifyNoul(input: VerifyInput): Promise<Result<readonly NoulVerdict[], VerifyFailure>> {
      if (input.checks.length === 0) return err({ kind: "invalid-input", issues: ["at least one check is required"] });
      const verdicts: NoulVerdict[] = [];
      for (const check of input.checks) {
        const row = table[check.id];
        if (!row) return err({ kind: "transport", message: `no fake verdict for ${JSON.stringify(check.id)}` });
        verdicts.push({ id: check.id, probabilityTrue: row.probabilityTrue, confidence: row.confidence });
      }
      return ok(verdicts);
    },
  };
}
