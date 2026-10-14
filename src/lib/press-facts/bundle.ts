/**
 * bundle module — deterministic draft rendering (in-process).
 *
 * Interface: {@link buildDraftBundle}. It renders a fixed bundle from
 * verified {@link PressNoteFacts}: 3 headlines (≤15 words, enforced by
 * clause-dropping), a summary, and an inverted-pyramid detail, each in
 * English and Hindi. Templates only rearrange cited values — the module
 * cannot invent names, dates, or numbers by construction. Anything
 * unconfirmed renders as an explicit "could not be confirmed" clause, never
 * a guess. Hindi uses a formal register with entities/numbers invariant;
 * fluency upgrades belong to a future LLM renderer behind this same seam.
 */
import type { FactField, PressNoteFacts } from "./facts";

export interface DraftBundle {
  readonly renderedBy: "template-v1";
  readonly headlinesEn: readonly [string, string, string];
  readonly headlinesHi: readonly [string, string, string];
  readonly summaryEn: string;
  readonly summaryHi: string;
  readonly detailEn: string;
  readonly detailHi: string;
  readonly citedSourceIds: readonly string[];
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

/** Fixed-shape triple: the bundle contract is exactly three headlines. */
function triple(first: string, second: string, third: string): readonly [string, string, string] {
  return [first, second, third];
}
const NOT_CONFIRMED_EN = "could not be confirmed from the available sources";
const NOT_CONFIRMED_HI = "उपलब्ध स्रोतों से पुष्टि नहीं हो सकी";

function casualtyClauseEn(facts: PressNoteFacts): string {
  const dead = textOf(facts.casualties.dead);
  const injured = textOf(facts.casualties.injured);
  if (dead === null && injured === null) {
    if (facts.casualties.dead.status === "conflicting" || facts.casualties.injured.status === "conflicting") {
      return `The number of casualties ${NOT_CONFIRMED_EN}.`;
    }
    return "";
  }
  const parts: string[] = [];
  if (dead !== null) parts.push(`${dead} dead`);
  if (injured !== null) parts.push(`${injured} injured`);
  return `As per available records, ${parts.join(" and ")} were reported.`;
}

function casualtyClauseHi(facts: PressNoteFacts): string {
  const dead = textOf(facts.casualties.dead);
  const injured = textOf(facts.casualties.injured);
  if (dead === null && injured === null) {
    if (facts.casualties.dead.status === "conflicting" || facts.casualties.injured.status === "conflicting") {
      return `हताहतों की संख्या ${NOT_CONFIRMED_HI}।`;
    }
    return "";
  }
  const parts: string[] = [];
  if (dead !== null) parts.push(`${dead} मृत`);
  if (injured !== null) parts.push(`${injured} घायल`);
  return `उपलब्ध रिकॉर्ड के अनुसार, ${parts.join(" और ")} की सूचना है।`;
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

export function buildDraftBundle(facts: PressNoteFacts): DraftBundle {
  const event = textOf(facts.event) ?? "Official press note";
  const short = textOf(facts.eventShort) ?? event;
  const date = textOf(facts.date);
  const location = textOf(facts.location);
  const where = location ? `, ${location}` : "";
  const when = date ? ` on ${date}` : "";

  const headlinesEn = triple(
    capHeadline(`${short}${where}${when}`),
    capHeadline(
      textOf(facts.actionTaken) ? `${facts.actionTaken.value} in ${short}${where}` : `${short}${where}, details awaited`,
    ),
    capHeadline(
      facts.outcomes.length > 0 && facts.outcomes[0] !== undefined
        ? `${facts.outcomes[0]}: ${short}${where}`
        : `${short}: official statement${where}`,
    ),
  );

  const headlinesHi = triple(
    capHeadline(`प्रेस नोट: ${short}${location ? `, ${location}` : ""}${date ? `, ${date}` : ""}`),
    capHeadline(
      textOf(facts.actionTaken) && facts.actionTaken.value
        ? `${short}${where} में ${facts.actionTaken.value}`
        : `${short}: आधिकारिक वक्तव्य`,
    ),
    capHeadline(
      facts.outcomes.length > 0 && facts.outcomes[0] !== undefined
        ? `${facts.outcomes[0]}: ${short}`
        : `${short} पर आधिकारिक सूचना`,
    ),
  );

  const leadEn = `${event}${where}${when ? `${when}` : ""}.`;
  const whoEn =
    facts.participants.length > 0
      ? ` Participants: ${facts.participants.join(", ")}.`
      : ` Participant details ${NOT_CONFIRMED_EN}.`;
  const summaryEn = `${leadEn}${whoEn} ${
    facts.outcomes.length > 0 ? `Key outcome: ${facts.outcomes.join("; ")}.` : `Outcomes ${NOT_CONFIRMED_EN}.`
  }`;

  const summaryHi = `${event}${location ? `, ${location}` : ""}${date ? `, ${date}` : ""}।${
    facts.participants.length > 0
      ? ` प्रतिभागी: ${facts.participants.join(", ")}।`
      : ` प्रतिभागियों का विवरण ${NOT_CONFIRMED_HI}।`
  }${facts.outcomes.length > 0 ? ` मुख्य परिणाम: ${facts.outcomes.join("; ")}।` : ` परिणाम ${NOT_CONFIRMED_HI}।`}`;

  const paragraphsEn: string[] = [leadEn + whoEn];
  const casualtyEn = casualtyClauseEn(facts);
  if (casualtyEn) paragraphsEn.push(casualtyEn);
  const crime = textOf(facts.allegedCrime);
  const accused = textOf(facts.accused);
  if (crime !== null) {
    paragraphsEn.push(`The alleged offence is ${crime}${accused ? `; the accused is ${accused}` : ""}. Investigation is underway.`);
  } else if (accused !== null) {
    paragraphsEn.push(`The accused is ${accused}. The exact charges ${NOT_CONFIRMED_EN}.`);
  }
  const action = textOf(facts.actionTaken);
  paragraphsEn.push(
    action ? `Action taken: ${action}.` : "Further details are awaited.",
  );
  if (facts.outcomes.length > 0) paragraphsEn.push(`Outcomes: ${facts.outcomes.join("; ")}.`);

  const paragraphsHi: string[] = [
    `${event}${location ? `, ${location}` : ""}${date ? `, ${date}` : ""}।${
      facts.participants.length > 0 ? ` प्रतिभागी: ${facts.participants.join(", ")}।` : ""
    }`,
  ];
  const casualtyHi = casualtyClauseHi(facts);
  if (casualtyHi) paragraphsHi.push(casualtyHi);
  if (crime !== null) {
    paragraphsHi.push(`कथित अपराध ${crime} है${accused ? `; आरोपी ${accused} है` : ""}। जांच जारी है।`);
  } else if (accused !== null) {
    paragraphsHi.push(`आरोपी ${accused} है। सटीक आरोप ${NOT_CONFIRMED_HI}।`);
  }
  paragraphsHi.push(action ? `की गई कार्रवाई: ${action}।` : "अधिक विवरण की प्रतीक्षा है।");
  if (facts.outcomes.length > 0) paragraphsHi.push(`परिणाम: ${facts.outcomes.join("; ")}।`);

  return {
    renderedBy: "template-v1",
    headlinesEn,
    headlinesHi,
    summaryEn,
    summaryHi,
    detailEn: paragraphsEn.join(" "),
    detailHi: paragraphsHi.join(" "),
    citedSourceIds: collectSourceIds(facts),
  };
}
