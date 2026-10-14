/**
 * press-facts module — SKIT005 bullet 1 core (true-deterministic logic).
 *
 * Interface: {@link structureFacts}. Callers submit extracted claims — each a
 * field value plus the source spans that back it (an LLM produces these later;
 * tests hand-write them) — and get back {@link PressNoteFacts} where every
 * scalar carries a {@link FieldStatus} and its citations. Rules, enforced here
 * so no caller can bypass them:
 *
 * - no claims → `not_stated` (never invent, never default to upload date);
 * - claim without a span → `unverified`;
 * - two spans disagreeing → `conflicting` with both candidates retained;
 * - casualty/crime fields are `not_stated` unless an explicit cited value
 *   exists (template bans on "at least/around" live in the bundle module).
 *
 * The module never touches the network; the Jev/LLM verifier plugs in later
 * as a separate port. Error mode: malformed claim input → `invalid-input`
 * with every issue at once.
 */
import { err, ok, type Result } from "@/lib/result/result";

export interface CitedSpan {
  readonly sourceId: string;
  readonly locator: string;
  readonly text: string;
}

export interface Claim {
  /** Index into the `spans` array, or null when the value has no source. */
  readonly spanIndex: number | null;
  readonly value: string;
}

export type FieldStatus = "confirmed" | "unverified" | "not_stated" | "conflicting";

export interface FactField {
  readonly value: string | null;
  readonly status: FieldStatus;
  readonly citations: readonly CitedSpan[];
  readonly candidates?: readonly { readonly value: string; readonly citations: readonly CitedSpan[] }[];
}

export interface Casualties {
  readonly dead: FactField;
  readonly injured: FactField;
}

export interface PressNoteFacts {
  readonly event: FactField;
  readonly eventShort: FactField;
  readonly date: FactField;
  readonly time: FactField;
  readonly location: FactField;
  readonly participants: readonly string[];
  readonly participantsCited: boolean;
  readonly outcomes: readonly string[];
  readonly outcomesCited: boolean;
  readonly casualties: Casualties;
  readonly allegedCrime: FactField;
  readonly accused: FactField;
  readonly actionTaken: FactField;
}

export interface StructureInput {
  readonly spans: readonly CitedSpan[];
  readonly claims: Readonly<Record<string, readonly Claim[]>>;
}

export interface StructureIssue {
  readonly field: string;
  readonly reason: string;
}

const SINGLE_FIELDS = [
  "event",
  "eventShort",
  "date",
  "time",
  "location",
  "dead",
  "injured",
  "allegedCrime",
  "accused",
  "actionTaken",
] as const;

type SingleField = (typeof SINGLE_FIELDS)[number];

function emptyField(): FactField {
  return { value: null, status: "not_stated", citations: [] };
}

function resolveClaim(
  field: string,
  claims: readonly Claim[] | undefined,
  spans: readonly CitedSpan[],
): { field: FactField; issues: StructureIssue[] } {
  if (!claims || claims.length === 0) return { field: emptyField(), issues: [] };

  const issues: StructureIssue[] = [];
  const cited: { value: string; span: CitedSpan }[] = [];
  let hasUncited = false;

  for (const claim of claims) {
    if (claim.spanIndex === null) {
      hasUncited = true;
      continue;
    }
    const span = spans[claim.spanIndex];
    if (span === undefined) {
      issues.push({ field, reason: `claim cites span ${claim.spanIndex}, which does not exist` });
      continue;
    }
    cited.push({ value: claim.value, span });
  }

  const distinct = [...new Set(cited.map((c) => c.value))];
  if (distinct.length > 1) {
    const candidates = distinct.map((value) => ({
      value,
      citations: cited.filter((c) => c.value === value).map((c) => c.span),
    }));
    return {
      field: { value: null, status: "conflicting", citations: [], candidates },
      issues,
    };
  }
  if (distinct.length === 1 && distinct[0] !== undefined) {
    const value: string = distinct[0];
    return {
      field: { value, status: "confirmed", citations: cited.map((c) => c.span) },
      issues,
    };
  }
  if (hasUncited) {
    const first = claims.find((c) => c.spanIndex === null);
    return {
      field: { value: first?.value ?? null, status: "unverified", citations: [] },
      issues,
    };
  }
  return { field: emptyField(), issues };
}

function mergeList(claims: readonly Claim[] | undefined, spans: readonly CitedSpan[]): {
  values: string[];
  cited: boolean;
} {
  if (!claims || claims.length === 0) return { values: [], cited: false };
  const values: string[] = [];
  let cited = false;
  for (const claim of claims) {
    if (!values.includes(claim.value)) values.push(claim.value);
    if (claim.spanIndex !== null && spans[claim.spanIndex] !== undefined) cited = true;
  }
  return { values, cited };
}

export function structureFacts(input: StructureInput): Result<PressNoteFacts, StructureIssue[]> {
  const issues: StructureIssue[] = [];
  const fields: Record<SingleField, FactField> = {} as Record<SingleField, FactField>;

  for (const name of SINGLE_FIELDS) {
    const resolved = resolveClaim(name, input.claims[name], input.spans);
    fields[name] = resolved.field;
    issues.push(...resolved.issues);
  }

  if (issues.length > 0) return err(issues);

  const participants = mergeList(input.claims["participants"], input.spans);
  const outcomes = mergeList(input.claims["outcomes"], input.spans);

  return ok({
    event: fields.event,
    eventShort: fields.eventShort,
    date: fields.date,
    time: fields.time,
    location: fields.location,
    participants: participants.values,
    participantsCited: participants.cited,
    outcomes: outcomes.values,
    outcomesCited: outcomes.cited,
    casualties: { dead: fields.dead, injured: fields.injured },
    allegedCrime: fields.allegedCrime,
    accused: fields.accused,
    actionTaken: fields.actionTaken,
  });
}
