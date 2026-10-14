export type DomainProfileId =
  | "public-safety"
  | "disaster-response"
  | "corporate-crisis"
  | "legal-compliance";

export interface DomainProfile {
  readonly id: DomainProfileId;
  readonly label: string;
  readonly entityName: string;
  readonly actorRole: string;
  readonly description: string;
  readonly defaultTitlePlaceholder: string;
  readonly badgeVariant: "sage" | "gold" | "sky" | "coral";
  readonly factCategories: readonly string[];
  readonly sampleDraft: {
    readonly headline: string;
    readonly summary: string;
    readonly detail: string;
    readonly secondaryHeadline: string;
    readonly secondarySummary: string;
  };
}

export const DOMAIN_PROFILES: Record<DomainProfileId, DomainProfile> = {
  "public-safety": {
    id: "public-safety",
    label: "Public Safety & Law Enforcement",
    entityName: "Incident Dossier",
    actorRole: "Investigating Officer",
    description: "Police incident records, FIR evidence, forensic photos, and verified press releases.",
    defaultTitlePlaceholder: "FIR 402/2026 - Cyber Fraud & Identity Theft",
    badgeVariant: "gold",
    factCategories: ["Accused Persons", "Recovery & Evidence", "Charges & Statutory Sections", "Investigation Timeline"],
    sampleDraft: {
      headline: "FIR Registered in Online Cyber Fraud Scheme, Jaipur",
      summary: "Authorities have registered an FIR regarding an online fraudulent scheme. Three accused persons have been arrested following a targeted operation. The exact amount and detailed charges remain subject to ongoing investigation.",
      detail: "On receipt of formal complaints, an investigation was initiated into fraudulent digital transactions. Three accused individuals were taken into custody. Police seized electronic evidence and bank records for forensic auditing. Further legal proceedings are in progress under relevant sections of the law.",
      secondaryHeadline: "[Localized Release: Cyber fraud matter under investigation]",
      secondarySummary: "[Localized Summary: Three individuals apprehended, evidence secured for judicial processing]",
    },
  },
  "disaster-response": {
    id: "disaster-response",
    label: "Disaster & Emergency Response",
    entityName: "Situation Report (SITREP)",
    actorRole: "Incident Commander",
    description: "Flood, cyclone, and civic emergency briefings, evacuation directives, and public health advisories.",
    defaultTitlePlaceholder: "SITREP #04 - Coastal Storm Surge & Evacuation Directive",
    badgeVariant: "sky",
    factCategories: ["Weather Severity", "Evacuation Zones", "Relief Centers", "Casualty & Rescue Stats"],
    sampleDraft: {
      headline: "Coastal Cyclone Advisory: Stage 3 Evacuation Orders Issued",
      summary: "Emergency operations centers have issued mandatory evacuation orders for low-lying coastal sectors. Shelters are fully operational with food, medical supplies, and backup power.",
      detail: "Meteorological monitoring indicates storm surge heights exceeding predicted thresholds. Search and rescue teams have been pre-positioned in vulnerable districts. Citizens in designated coastal blocks are instructed to move immediately to identified relief centers.",
      secondaryHeadline: "[Localized Advisory: Coastal storm emergency directives active]",
      secondarySummary: "[Localized Summary: Evacuation shelters established, emergency personnel deployed]",
    },
  },
  "corporate-crisis": {
    id: "corporate-crisis",
    label: "Corporate Crisis & Incident PR",
    entityName: "Incident Statement",
    actorRole: "Communications Lead",
    description: "Cybersecurity disclosures, product recall advisories, executive statements, and stakeholder releases.",
    defaultTitlePlaceholder: "Security Advisory - Incident Containment & System Audit",
    badgeVariant: "coral",
    factCategories: ["Impact Scope", "Containment Actions", "Customer Protections", "Regulatory Notification"],
    sampleDraft: {
      headline: "Official Statement: Security Incident Detected and Contained",
      summary: "Our information security team detected unauthorized access attempts on an isolated testing environment. No core customer financial databases were breached, and all affected systems have been isolated and patched.",
      detail: "Upon notification from automated threat detection systems, incident response protocols were immediately activated. Independent forensic investigators have been engaged, and relevant data protection authorities have been notified in compliance with statutory disclosure timelines.",
      secondaryHeadline: "[Localized Statement: Security incident containment notification]",
      secondarySummary: "[Localized Summary: Threat isolated, independent forensic review active]",
    },
  },
  "legal-compliance": {
    id: "legal-compliance",
    label: "Legal & Regulatory Compliance",
    entityName: "Statutory Disclosure",
    actorRole: "Compliance Counsel",
    description: "Regulatory announcements, judicial order summaries, SEBI/SEC disclosure filings, and compliance statements.",
    defaultTitlePlaceholder: "Disclosure Notice - Regulatory Inquiry & Tribunal Order",
    badgeVariant: "sage",
    factCategories: ["Statutory Provisions", "Tribunal Orders", "Filing Deadlines", "Material Impact"],
    sampleDraft: {
      headline: "Statutory Disclosure: Adjudication Order Received from Regulatory Authority",
      summary: "The company has received an adjudication order from the regulatory authority regarding procedural filing timelines. Management has initiated an administrative review to file an appeal within the prescribed limitation period.",
      detail: "In compliance with applicable listing disclosure obligations, notice is hereby given regarding the regulatory findings. The financial impact is non-material to operations, and legal counsel has been retained to represent the entity before the appellate tribunal.",
      secondaryHeadline: "[Localized Notice: Statutory regulatory disclosure]",
      secondarySummary: "[Localized Summary: Adjudication order received, appeal process underway]",
    },
  },
};

export const DOMAIN_PROFILE_LIST: readonly DomainProfile[] = [
  DOMAIN_PROFILES["public-safety"],
  DOMAIN_PROFILES["disaster-response"],
  DOMAIN_PROFILES["corporate-crisis"],
  DOMAIN_PROFILES["legal-compliance"],
];

export function getDomainProfile(id?: string | null): DomainProfile {
  if (id && id in DOMAIN_PROFILES) {
    return DOMAIN_PROFILES[id as DomainProfileId];
  }
  return DOMAIN_PROFILES["public-safety"];
}
