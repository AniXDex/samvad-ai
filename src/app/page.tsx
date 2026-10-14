import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, FileText, ShieldCheck, Scale, Languages, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage(): Promise<React.JSX.Element> {
  const { isAuthenticated, userId } = await auth();
  const user = isAuthenticated ? await currentUser() : null;

  const officerName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress.split("@")[0] ||
    "Officer";
  const officerEmail = user?.emailAddresses[0]?.emailAddress ?? "N/A";

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-border/70 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="gold" className="px-3 py-1 text-xs">
              <span className="size-1.5 rounded-full bg-gold animate-pulse mr-1" />
              Sovereign Police AI System
            </Badge>
            <Badge variant="outline" className="text-xs">
              IEEE-IGNITE SKIT005
            </Badge>
          </div>

          {!isAuthenticated ? (
            <div className="max-w-3xl space-y-6">
              <h1 className="font-story text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.08]">
                Turn raw case evidence into{" "}
                <span className="italic font-normal underline decoration-brand decoration-wavy underline-offset-8">
                  verified, neutral
                </span>{" "}
                press notes.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Equip police officers and administrative spokespersons to distill FIR scans,
                voice debriefs, and evidence files into dual-language drafts — guaranteeing
                zero premature guilt declarations with complete editorial sign-off.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2 shadow-panel">
                    Sign In to Officer Portal <ArrowRight className="size-4" />
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline" size="lg">
                    Create Officer Account
                  </Button>
                </SignUpButton>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-2xl bg-card ring-1 ring-foreground/10 shadow-soft">
                <div className="flex items-center gap-4">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-14 h-14 rounded-full ring-2 ring-primary/30",
                      },
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-story text-2xl sm:text-3xl font-semibold tracking-tight">
                        Welcome back, {officerName}
                      </h2>
                      <Badge variant="sage" className="text-[0.7rem]">
                        Authorized Officer
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {officerEmail} • ID: {userId}
                    </p>
                  </div>
                </div>

                <Link href="/dossiers">
                  <Button size="lg" className="gap-2">
                    Open Case Dossiers <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>

              {/* Three-step officer workflow */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/dossiers" className="group block">
                  <Card className="h-full hover:ring-foreground/20 hover:shadow-panel transition-all">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit text-[0.65rem] font-mono">
                        STEP 01
                      </Badge>
                      <CardTitle className="group-hover:text-foreground/90 flex items-center justify-between">
                        Scaffold Dossier
                        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>
                        Create an auditable case container with strict tenant isolation.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dossiers" className="group block">
                  <Card className="h-full hover:ring-foreground/20 hover:shadow-panel transition-all">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit text-[0.65rem] font-mono">
                        STEP 02
                      </Badge>
                      <CardTitle className="group-hover:text-foreground/90 flex items-center justify-between">
                        Upload Evidence
                        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>
                        Direct R2 presigned upload for FIR photos and Sarvam STT voice notes.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>

                <Link href="/dossiers" className="group block">
                  <Card className="h-full hover:ring-foreground/20 hover:shadow-panel transition-all">
                    <CardHeader>
                      <Badge variant="outline" className="w-fit text-[0.65rem] font-mono">
                        STEP 03
                      </Badge>
                      <CardTitle className="group-hover:text-foreground/90 flex items-center justify-between">
                        Review &amp; Approve
                        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>
                        Laya fact verification, Qdrant precedent phrasing, and digital signing.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sovereign Architecture Pillars */}
      <section className="py-16 max-w-5xl mx-auto px-6 w-full space-y-10">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase font-mono">
            Core Principles
          </Badge>
          <h2 className="font-story text-3xl sm:text-4xl font-semibold tracking-tight">
            Designed for Sovereign Accountability
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Every sentence points to its evidence source. Zero unsupervised generative hallucinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-coral-soft text-coral">
                  <Scale className="size-5" />
                </span>
                <CardTitle>Zero Guilt Declaration</CardTitle>
              </div>
              <CardDescription>
                Neutrality scanner flags accusatory words before judicial conviction. Enforces &quot;alleged&quot; and factual attribution under legal standards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-sky-soft text-sky">
                  <Languages className="size-5" />
                </span>
                <CardTitle>Dual-Language Generation</CardTitle>
              </div>
              <CardDescription>
                Outputs 3 concise headline options (&le;15 words each), an inverted pyramid brief, and verified summaries in both English and Hindi.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-gold/15 text-gold">
                  <FileText className="size-5" />
                </span>
                <CardTitle>End-to-End Source Traceability</CardTitle>
              </div>
              <CardDescription>
                Every factual claim is pinned to exact FIR pages (Mistral OCR) or timestamped audio segments (Sarvam STT) for instant visual cross-referencing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-sage-soft text-sage">
                  <ShieldCheck className="size-5" />
                </span>
                <CardTitle>Strict Human-in-the-Loop Gating</CardTitle>
              </div>
              <CardDescription>
                Automated publishing is architecturally impossible. Trigger.dev waitpoints require authenticated officer checklist confirmation before release.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Engine Pipeline Status */}
        <div className="p-5 rounded-2xl bg-card ring-1 ring-foreground/10 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Sparkles className="size-3.5 text-brand" /> Engine Status Ledger
            </span>
            <span className="text-[0.65rem] font-mono text-muted-foreground">All Deep Modules Active</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block">Authentication</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Clerk RBAC
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block">Document OCR</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Mistral Vision
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block">Audio Briefing</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Sarvam Saaras
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block">Vector Retrieval</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Qdrant Semantic
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

