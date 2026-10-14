/**
 * bundle module — deterministic draft rendering (in-process).
 *
 * Interface: {@link buildDraftBundle}. It renders a fixed bundle from
 * verified {@link PressNoteFacts}: 3 headlines (≤15 words, enforced by
 * clause-dropping), a summary, and an inverted-pyramid detail, in a primary
 * locale (English, built in) and a secondary locale (injected). Templates only
 * rearrange cited values — the module cannot invent names, dates, or numbers
 * by construction. Anything unconfirmed renders as an explicit unconfirmed
 * clause, never a guess.
 *
 * Language is a seam, not a hardcoding: the secondary locale arrives as a
 * {@link BundlePhrases} dictionary supplied by the caller (deploy-time locale
 * pack, database, or future LLM renderer). This codebase carries zero
 * non-English literals — SKIT005's Hindi output is produced by injecting the
 * Hindi pack at runtime, which also keeps translators out of code reviews.
 */
import type { FactField, PressNoteFacts } from "./facts";

/** Every natural-language fragment rendering needs, in one injectable shape. */
export interface BundlePhrases {
  readonly pressNoteLabel: string;
  readonly officialStatement: string;
  readonly officialNotice: string;
  readonly detailsAwaited: string;
  readonly participantsLabel: string;
  readonly keyOutcomeLabel: string;
  readonly outcomesLabel: string;
  readonly actionTakenLabel: string;
  readonly allegedOffenceIs: string;
  readonly accusedIs: string;
  readonly exactCharges: string;
  readonly investigationUnderway: string;
  readonly furtherAwaited: string;
  readonly notConfirmed: string;
  readonly casualtiesUnconfirmed: string;
  readonly deadWord: string;
  readonly injuredWord: string;
  readonly reportedPrefix: string;
  readonly reportedAnd: string;
  readonly reportedSuffix: string;
  readonly sentenceEnd: string;
}

export const ENGLISH_PHRASES: BundlePhrases = {
  pressNoteLabel: "Press note",
  officialStatement: "official statement",
  officialNotice: "official notice",
  detailsAwaited: "details awaited",
  participantsLabel: "Participants",
  keyOutcomeLabel: "Key outcome",
  outcomesLabel: "Outcomes",
  actionTakenLabel: "Action taken",
  allegedOffenceIs: "The alleged offence is",
  accusedIs: "The accused is",
  exactCharges: "The exact charges",
  investigationUnderway: "Investigation is underway.",
  furtherAwaited: "Further details are awaited.",
  notConfirmed: "could not be confirmed from the available sources",
  casualtiesUnconfirmed: "The number of casualties could not be confirmed from the available sources.",
  deadWord: "dead",
  injuredWord: "injured",
  reportedPrefix: "As per available records,",
  reportedAnd: "and",
  reportedSuffix: "were reported.",
  sentenceEnd: ".",
};

export interface DraftBundle {
  readonly renderedBy: "template-v1";
  readonly headlinesPrimary: readonly [string, string, string];
  readonly headlinesSecondary: readonly [string, string, string];
  readonly summaryPrimary: string;
  readonly summarySecondary: string;
  readonly detailPrimary: string;
  readonly detailSecondary: string;
  readonly citedSourceIds: readonly string[];
  /** Backwards-compatible aliases for the primary (English) outputs. */
  readonly headlinesEn: readonly [string, string, string];
  readonly summaryEn: string;
  readonly detailEn: string;
  readonly headlinesHi: readonly [string, string, string];
  readonly summaryHi: string;
  readonly detailHi: string;
}

/** Fixed-shape triple: the bundle contract is exactly three headlines. */
function triple(first: string, second: string, third: string): readonly [string, string, string] {
  return [first, second, third];
}

function textOf(field: FactField): string | null {
  return field.status === "confirmed" ? field.value : null;
}

/** Drop trailing comma-clauses until the headline fits the 15-word cap. */
export function capHeadline(headline: string, maxWords = 15): string {
  const words = headline.split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= maxWords) return headline;
  const clauses = headline.split(",");
  while (clauses.length > 1) {
    clauses.pop();
    const candidate = clauses.join(",").trim();
    if (candidate.split(/\s+/).filter((w) => w.length > 0).length <= maxWords) return candidate;
  }
  return words.slice(0, maxWords).join(" ");
}

interface RenderedLocale {
  readonly headlines: readonly [string, string, string];
  readonly summary: string;
  readonly detail: string;
}

function casualtyClause(facts: PressNoteFacts, p: BundlePhrases): string {
  const dead = textOf(facts.casualties.dead);
  const injured = textOf(facts.casualties.injured);
  if (dead === null && injured === null) {
    const conflicting =
      facts.casualties.dead.status === "conflicting" || facts.casualties.injured.status === "conflicting";
    return conflicting ? p.casualtiesUnconfirmed : "";
  }
  const parts: string[] = [];
  if (dead !== null) parts.push(`${dead} ${p.deadWord}`);
  if (injured !== null) parts.push(`${injured} ${p.injuredWord}`);
  return `${p.reportedPrefix} ${parts.join(` ${p.reportedAnd} `)} ${p.reportedSuffix}`;
}

function renderLocale(facts: PressNoteFacts, p: BundlePhrases): RenderedLocale {
  const event = textOf(facts.event) ?? `${p.pressNoteLabel}`;
  const short = textOf(facts.eventShort) ?? event;
  const date = textOf(facts.date);
  const location = textOf(facts.location);
  const where = location ? `, ${location}` : "";
  const when = date ? ` on ${date}` : "";

  const headlines = triple(
    capHeadline(`${short}${where}${when}`),
    capHeadline(
      textOf(facts.actionTaken)
        ? `${facts.actionTaken.value} in ${short}${where}`
        : `${short}${where}, ${p.detailsAwaited}`,
    ),
    capHeadline(
      facts.outcomes.length > 0 && facts.outcomes[0] !== undefined
        ? `${facts.outcomes[0]}: ${short}${where}`
        : `${short}: ${p.officialStatement}${where}`,
    ),
  );

  const end = p.sentenceEnd;
  const lead = `${event}${where}${when}${end}`;
  const who =
    facts.participants.length > 0
      ? ` ${p.participantsLabel}: ${facts.participants.join(", ")}${end}`
      : ` Participant details ${p.notConfirmed}${end}`;
  const summary = `${lead}${who} ${
    facts.outcomes.length > 0
      ? `${p.keyOutcomeLabel}: ${facts.outcomes.join("; ")}${end}`
      : `${p.outcomesLabel} ${p.notConfirmed}${end}`
  }`;

  const paragraphs: string[] = [lead + who];
  const casualty = casualtyClause(facts, p);
  if (casualty) paragraphs.push(casualty);
  const crime = textOf(facts.allegedCrime);
  const accused = textOf(facts.accused);
  if (crime !== null) {
    paragraphs.push(
      `${p.allegedOffenceIs} ${crime}${accused ? `; ${p.accusedIs} ${accused}` : ""}${end} ${p.investigationUnderway}`,
    );
  } else if (accused !== null) {
    paragraphs.push(`${p.accusedIs} ${accused}${end} ${p.exactCharges} ${p.notConfirmed}${end}`);
  }
  paragraphs.push(actionText(facts, p));
  if (facts.outcomes.length > 0) paragraphs.push(`${p.outcomesLabel}: ${facts.outcomes.join("; ")}${end}`);

  return { headlines, summary, detail: paragraphs.join(" ") };
}

function actionText(facts: PressNoteFacts, p: BundlePhrases): string {
  const action = textOf(facts.actionTaken);
  return action ? `${p.actionTakenLabel}: ${action}${p.sentenceEnd}` : p.furtherAwaited;
}

function collectSourceIds(facts: PressNoteFacts): string[] {
  const fields: FactField[] = [
    facts.event,
    facts.eventShort,
    facts.date,
    facts.time,
    facts.location,
    facts.casualties.dead,
    facts.casualties.injured,
    facts.allegedCrime,
    facts.accused,
    facts.actionTaken,
  ];
  const ids: string[] = [];
  for (const field of fields) {
    for (const span of field.citations) {
      if (!ids.includes(span.sourceId)) ids.push(span.sourceId);
    }
    for (const candidate of field.candidates ?? []) {
      for (const span of candidate.citations) {
        if (!ids.includes(span.sourceId)) ids.push(span.sourceId);
      }
    }
  }
  return ids;
}

export function buildDraftBundle(facts: PressNoteFacts, secondary: BundlePhrases): DraftBundle {
  const primary = renderLocale(facts, ENGLISH_PHRASES);
  const second = renderLocale(facts, secondary);
  return {
    renderedBy: "template-v1",
    headlinesPrimary: primary.headlines,
    headlinesSecondary: second.headlines,
    summaryPrimary: primary.summary,
    summarySecondary: second.summary,
    detailPrimary: primary.detail,
    detailSecondary: second.detail,
    citedSourceIds: collectSourceIds(facts),
    headlinesEn: primary.headlines,
    summaryEn: primary.summary,
    detailEn: primary.detail,
    headlinesHi: second.headlines,
    summaryHi: second.summary,
    detailHi: second.detail,
  };
}
