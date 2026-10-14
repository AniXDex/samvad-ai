"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkNeutrality, type NeutralityFlag } from "@/lib/press-facts/neutrality";
import { HEADLINE_MAX_WORDS } from "@/lib/press-facts/bundle";
import { approveDocumentAction, saveRevisionAction } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { DocumentStatus } from "@/server/documents/store";

export interface SourceItem {
  readonly id: string;
  readonly documentId: string;
  readonly kind: string;
  readonly r2Key: string | null;
  readonly sha256: string | null;
  readonly metadata: unknown;
  readonly createdAt: Date;
}

export interface RevisionItem {
  readonly id: string;
  readonly documentId: string;
  readonly revisionNumber: number;
  readonly diff: unknown;
  readonly factsSnapshot: unknown;
  readonly bundleSnapshot: unknown;
  readonly authorId: string;
  readonly reason: string;
  readonly approved: boolean;
  readonly approvedBy: string | null;
  readonly approvedAt: Date | null;
  readonly createdAt: Date;
}

export interface DocumentDetail {
  readonly id: string;
  readonly tenantId: string;
  readonly title: string;
  readonly status: DocumentStatus;
  readonly createdAt: Date;
  readonly sources: readonly SourceItem[];
  readonly revisions: readonly RevisionItem[];
}

interface ReviewEditorProps {
  readonly initialDoc: DocumentDetail;
  readonly currentUserId: string;
}

export function ReviewEditor({ initialDoc, currentUserId }: ReviewEditorProps): React.JSX.Element {
  const router = useRouter();
  const [doc, setDoc] = React.useState<DocumentDetail>(initialDoc);
  const [status, setStatus] = React.useState<DocumentStatus>(initialDoc.status);

  // Editable draft states
  const [headline1, setHeadline1] = React.useState("FIR Registered in Online Cyber Fraud Scheme, Jaipur");
  const [headline2, setHeadline2] = React.useState("Three Accused Persons Apprehended by Police Team");
  const [headline3, setHeadline3] = React.useState("Official Statement Issued: Full Inquiry Underway");
  const [summary, setSummary] = React.useState(
    "Police authorities have registered an FIR regarding an online fraudulent scheme. Three accused persons have been arrested following a targeted operation. The exact amount and detailed charges remain subject to ongoing investigation."
  );
  const [detail, setDetail] = React.useState(
    "On receipt of formal complaints, an investigation was initiated into fraudulent digital transactions. Three accused individuals were taken into custody. Police seized electronic evidence and bank records for forensic auditing. Further legal proceedings are in progress under relevant sections of the law."
  );

  // Secondary bundle preview state (injected via runtime locale seam)
  const [secondaryHeadline, setSecondaryHeadline] = React.useState(
    "[Secondary Locale Headline: Case registered in cyber fraud inquiry]"
  );
  const [secondarySummary, setSecondarySummary] = React.useState(
    "[Secondary Locale Summary: Three accused individuals apprehended; evidence collected for investigation]"
  );

  // Revision state
  const [revisionReason, setRevisionReason] = React.useState("");
  const [savingRevision, setSavingRevision] = React.useState(false);
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = React.useState(false);

  // Approval state
  const [confirmedCheckbox, setConfirmedCheckbox] = React.useState(false);
  const [approving, setApproving] = React.useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = React.useState(false);

  // Real-time neutrality check
  const fullDraftText = `${headline1} ${headline2} ${headline3} ${summary} ${detail}`;
  const neutralityFlags: NeutralityFlag[] = React.useMemo(() => {
    return checkNeutrality(fullDraftText);
  }, [fullDraftText]);

  // Word counts
  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const h1Words = countWords(headline1);
  const h2Words = countWords(headline2);
  const h3Words = countWords(headline3);

  async function handleApprove() {
    if (!confirmedCheckbox) return;
    setApproving(true);
    try {
      const res = await approveDocumentAction({
        documentId: doc.id,
        tenantId: doc.tenantId,
      });
      if (res.success) {
        setStatus("approved");
        setDoc((prev) => ({ ...prev, status: "approved" }));
        setIsApproveDialogOpen(false);
        router.refresh();
      }
    } finally {
      setApproving(false);
    }
  }

  async function handleSaveRevision() {
    if (!revisionReason.trim()) return;
    setSavingRevision(true);
    try {
      const nextRevNumber = (doc.revisions.length || 0) + 1;
      const res = await saveRevisionAction({
        documentId: doc.id,
        revisionNumber: nextRevNumber,
        reason: revisionReason.trim(),
        diff: {
          headline1,
          headline2,
          headline3,
          summary,
          detail,
        },
      });
      if (res.success) {
        setIsRevisionDialogOpen(false);
        const reason = revisionReason.trim();
        setRevisionReason("");
        setDoc((prev) => ({
          ...prev,
          revisions: [
            ...prev.revisions,
            {
              id: res.data?.revisionId ?? `rev-${Date.now()}`,
              documentId: prev.id,
              revisionNumber: nextRevNumber,
              authorId: currentUserId,
              reason,
              diff: { headline1, headline2, headline3, summary, detail },
              factsSnapshot: null,
              bundleSnapshot: null,
              approved: false,
              approvedBy: null,
              approvedAt: null,
              createdAt: new Date(),
            },
          ],
        }));
        router.refresh();
      }
    } finally {
      setSavingRevision(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 max-w-7xl w-full mx-auto p-4 sm:p-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dossiers" className="text-xs text-muted-foreground hover:text-foreground">
              ← Back to Case Dossiers
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">Dossier: {doc.id}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">Officer ID: {currentUserId}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{doc.title}</h1>
            {status === "approved" ? (
              <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                Approved & Digitally Sealed
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                Draft (Pending Officer Approval)
              </Badge>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Save Revision Dialog */}
          <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              Save New Revision
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Case Revision</DialogTitle>
                <DialogDescription>
                  Enter the editorial or factual reason for this revision. Every change is logged into an immutable audit trail.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="text-xs font-semibold text-muted-foreground">Reason for Revision</label>
                <Input
                  placeholder="e.g. Corrected suspect name and verified casualty count with SHO"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button variant="default" disabled={!revisionReason.trim() || savingRevision} onClick={handleSaveRevision}>
                  {savingRevision ? "Saving..." : "Confirm & Save Revision"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Digital Sign-off Dialog */}
          {status === "draft" && (
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
              <DialogTrigger render={<Button variant="default" size="sm" />}>
                Approve & Seal Press Note
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Authorized Digital Sign-off</DialogTitle>
                  <DialogDescription>
                    Under SKIT005 sovereign protocols, publishing requires personal officer attestation against primary sources.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                    <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Legal Compliance Verification
                    </h4>
                    <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                      Presumption of innocence is strictly upheld. No non-adjudicated suspect may be termed a &quot;scamster&quot; or &quot;kingpin&quot;. Casualty numbers must match verified hospital/station records.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                    <Checkbox
                      id="confirm-verification"
                      checked={confirmedCheckbox}
                      onCheckedChange={(checked) => setConfirmedCheckbox(checked === true)}
                    />
                    <label htmlFor="confirm-verification" className="text-xs leading-relaxed cursor-pointer select-none">
                      <strong>Mandatory Attestation:</strong> I hereby certify that I have cross-checked all casualty, crime, and suspect claims in this press release against primary case evidence.
                    </label>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="default"
                    disabled={!confirmedCheckbox || approving}
                    onClick={handleApprove}
                    className="w-full sm:w-auto"
                  >
                    {approving ? "Sealing..." : "Digitally Seal & Approve Release"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Neutrality Alert Banner */}
      {neutralityFlags.length > 0 && (
        <Alert className="border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200">
          <AlertTitle className="text-sm font-bold flex items-center gap-2">
            <span>⚠️</span> Neutrality &amp; Guilt Pre-Check Warnings ({neutralityFlags.length} flagged)
          </AlertTitle>
          <AlertDescription className="text-xs mt-1 space-y-1">
            <p>The draft text contains language that could compromise sovereign legal neutrality:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {neutralityFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 border border-rose-500/30 font-semibold"
                >
                  [{flag.rule}] &quot;{flag.match}&quot;
                </span>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Sources & Evidence (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Primary Sources &amp; Evidence</CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {doc.sources.length} Attached
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Original FIR records, incident sheets, and officer audio notes stored immutably in Cloudflare R2.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {doc.sources.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">No source attachments uploaded yet.</p>
                  <p className="text-[11px] text-muted-foreground">Upload FIR PDF or audio note via R2 presigned ticket.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {doc.sources.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg border border-border bg-card/60 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase text-primary">{s.kind}</span>
                        <code className="text-[10px] text-muted-foreground">{s.id}</code>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        Key: {s.r2Key ?? "pending-upload"}
                      </p>
                      {s.sha256 && (
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          SHA: {s.sha256}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Source Text / Citation Locator View */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Evidence Spans
                </h4>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-xs space-y-2 font-mono">
                  <div className="p-2 rounded bg-card border border-border/80">
                    <span className="text-[10px] font-bold text-primary block">[Locator: FIR-P1-L3]</span>
                    <span className="text-[11px] text-foreground">
                      &quot;FIR No. 402/2026 registered at Cyber Crime Police Station under relevant cyber sections.&quot;
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border/80">
                    <span className="text-[10px] font-bold text-primary block">[Locator: FIR-P1-L12]</span>
                    <span className="text-[11px] text-foreground">
                      &quot;Three individuals apprehended; electronic devices and transaction logs recovered for investigation.&quot;
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border/80">
                    <span className="text-[10px] font-bold text-amber-600 block">[Locator: AUDIO-01:34]</span>
                    <span className="text-[11px] text-foreground">
                      &quot;Casualty details: No physical injuries sustained during apprehension.&quot;
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail & Revisions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Revision &amp; Audit Trail</CardTitle>
              <CardDescription className="text-xs">
                Every modification is recorded with author identity and timestamp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {doc.revisions.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-lg border border-border/70 bg-card/40 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Revision #{rev.revisionNumber}</span>
                      {rev.approved ? (
                        <span className="text-[10px] text-emerald-600 font-semibold">Approved</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Unapproved</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{rev.reason}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                      <span>Author: <code className="font-mono">{rev.authorId}</code></span>
                      <span>{new Date(rev.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Pane: Fact Matrix & Press Draft (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Fact Matrix */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Structured Fact Engine Matrix</CardTitle>
              <CardDescription className="text-xs">
                Deterministic fact breakdown: claims backed by citations vs unstated assertions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Event</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Cyber Fraud Scheme</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                      Confirmed
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Location</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Jaipur, Rajasthan</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                      Confirmed
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Accused</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">3 Individuals (Names Withheld)</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                      Confirmed
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Casualties (Injured / Dead)</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Zero Reported</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                      Confirmed
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Financial Loss</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Subject to Audit</span>
                    <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 text-[10px]">
                      Not Stated
                    </Badge>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Action Taken</span>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Custody &amp; Forensic Seizure</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 text-[10px]">
                      Confirmed
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Press Note Draft Editor */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Press Note Draft &amp; Dual-Language Bundle</CardTitle>
                  <CardDescription className="text-xs">
                    Fixed bundle format (3 headlines &le;15 words, summary, and inverted pyramid details).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground font-medium">Live Inverted Pyramid</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* English Headlines Triple */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Headline Candidates (Strictly &le; 15 words)
                </label>

                {/* Headline 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Option 1: Primary Event Lead</span>
                    <span className={h1Words > HEADLINE_MAX_WORDS ? "text-rose-500 font-bold" : "text-muted-foreground"}>
                      {h1Words} / {HEADLINE_MAX_WORDS} words
                    </span>
                  </div>
                  <Input
                    value={headline1}
                    onChange={(e) => setHeadline1(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                {/* Headline 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Option 2: Action Taken</span>
                    <span className={h2Words > HEADLINE_MAX_WORDS ? "text-rose-500 font-bold" : "text-muted-foreground"}>
                      {h2Words} / {HEADLINE_MAX_WORDS} words
                    </span>
                  </div>
                  <Input
                    value={headline2}
                    onChange={(e) => setHeadline2(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>

                {/* Headline 3 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Option 3: Official Notice</span>
                    <span className={h3Words > HEADLINE_MAX_WORDS ? "text-rose-500 font-bold" : "text-muted-foreground"}>
                      {h3Words} / {HEADLINE_MAX_WORDS} words
                    </span>
                  </div>
                  <Input
                    value={headline3}
                    onChange={(e) => setHeadline3(e.target.value)}
                    className="text-xs font-medium"
                  />
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Brief Press Summary (English)
                </label>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={3}
                  className="text-xs leading-relaxed"
                />
              </div>

              {/* Details (Inverted Pyramid) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Inverted-Pyramid Detailed Narrative (English)
                </label>
                <Textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={4}
                  className="text-xs leading-relaxed"
                />
              </div>

              <Separator />

              {/* Secondary Language Bundle (Hindi Seam) */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🇮🇳</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Secondary Locale Bundle (Hindi Seam)
                    </h4>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Runtime Locale Pack</span>
                </div>

                <div className="space-y-2">
                  <Input
                    value={secondaryHeadline}
                    onChange={(e) => setSecondaryHeadline(e.target.value)}
                    className="text-xs font-medium"
                  />
                  <Textarea
                    value={secondarySummary}
                    onChange={(e) => setSecondarySummary(e.target.value)}
                    rows={2}
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
