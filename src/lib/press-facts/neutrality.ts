/**
 * neutrality module — deterministic pre-check (in-process).
 *
 * Interface: {@link checkNeutrality}. It scans draft text for language no
 * official release may carry unreviewed: presumption of guilt, sensationalism,
 * and unverified scale. This is assistive, not determinative — the Jev
 * verifier and the human approver remain the real gates (see SPEC 002/003).
 * Flags carry the exact span so the editor UI can highlight them.
 */
export interface NeutralityFlag {
  readonly rule: "presumption-of-guilt" | "sensational" | "unverified-scale";
  readonly match: string;
  readonly index: number;
}

export interface NeutralityRule {
  readonly rule: NeutralityFlag["rule"];
  readonly patterns: readonly RegExp[];
}

/**
 * Reviewed baseline lexicon. Deployments tune it by passing their own rules
 * array — new patterns ship as config, not code edits.
 */
export const DEFAULT_NEUTRALITY_RULES: readonly NeutralityRule[] = [
  {
    rule: "presumption-of-guilt",
    patterns: [/\bguilty\b/i, /\bkingpin\b/i, /\bscamster\b/i, /\bconfessed\b/i, /\bconvict(?:ed)?\b/i],
  },
  {
    rule: "sensational",
    patterns: [/\bscandal\b/i, /\bsensational\b/i, /\bshocking\b/i, /\bbusted\b/i],
  },
  {
    rule: "unverified-scale",
    patterns: [/\bat least \d/i, /\baround \d/i, /\bcrores siphoned\b/i],
  },
];

export function checkNeutrality(text: string, rules: readonly NeutralityRule[] = DEFAULT_NEUTRALITY_RULES): NeutralityFlag[] {
  const flags: NeutralityFlag[] = [];
  for (const { rule, patterns } of rules) {
    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(text);
      if (match?.[0] !== undefined && match.index !== undefined) {
        flags.push({ rule, match: match[0], index: match.index });
      }
    }
  }
  return flags;
}
