import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, ShieldCheck, Scale, Languages, Sparkles, Building2, Waves, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HomePage(): Promise<React.JSX.Element> {
  const { isAuthenticated, userId } = await auth();
  const user = isAuthenticated ? await currentUser() : null;

  const officerName =
    user?.fullName ||
    user?.firstName ||
    (user?.emailAddresses?.[0]?.emailAddress ? user.emailAddresses[0].emailAddress.split("@")[0] : null) ||
    "Officer";

  const officerEmail = user?.emailAddresses?.[0]?.emailAddress ?? "officer@department.gov.in";

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-border/70 py-16 sm:py-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Badge variant="gold" className="px-3 py-1 text-xs">
              <span className="size-1.5 rounded-full bg-gold animate-pulse mr-1" />
              High-Assurance Disclosure Platform
            </Badge>
            <Badge variant="outline" className="text-xs">
              Sovereign Multi-Sector Engine
            </Badge>
          </div>

          {!isAuthenticated ? (
            <div className="max-w-3xl space-y-6">
              <h1 className="font-story text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.08]">
                Turn raw incident evidence into{" "}
                <span className="italic font-normal underline decoration-brand decoration-wavy underline-offset-8">
                  verified, neutral
                </span>{" "}
                public disclosures.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Equip teams across public safety, disaster management, corporate crisis, and legal compliance to distill multimodal evidence files into dual-language releases — guaranteeing zero hallucination with cryptographic provenance and editorial sign-off.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2 shadow-panel">
                    Sign In to Incident Desk <ArrowRight className="size-4" />
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline" size="lg">
                    Create Team Account
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
                        Verified Member
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {officerEmail} • ID: {userId}
                    </p>
                  </div>
                </div>

                <Link href="/dossiers">
                  <Button size="lg" className="gap-2">
                    Open Incident Workspace <ArrowRight className="size-4" />
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
                        Select Workspace
                        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>
                        Choose domain profile: Public Safety, Disaster Response, Corporate PR, or Legal.
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
                        Attach Evidence
                        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>
                        Direct Cloudflare R2 upload for PDFs, incident scans, and voice audio notes.
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
                        Review &amp; Certify
                        <ArrowRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </CardTitle>
                      <CardDescription>
                        Verify citation-pinned facts, check neutrality, and stamp immutable SHA-256 seal.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Multi-Sector Capabilities */}
      <section className="py-16 max-w-5xl mx-auto px-6 w-full space-y-10">
        <div className="space-y-2">
          <Badge variant="outline" className="text-xs uppercase font-mono">
            Supported Verticals
          </Badge>
          <h2 className="font-story text-3xl sm:text-4xl font-semibold tracking-tight">
            One Architecture. Four High-Stakes Domains.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Configurable schemas, customized fact extractors, and domain-tuned guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-gold/15 text-gold">
                  <Shield className="size-5" />
                </span>
                <CardTitle>Public Safety &amp; Law Enforcement</CardTitle>
              </div>
              <CardDescription>
                FIR analysis, crime scene evidence photos, and witness debrief transcription. Guarantees zero premature guilt declarations under legal standards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-sky-soft text-sky">
                  <Waves className="size-5" />
                </span>
                <CardTitle>Disaster &amp; Emergency Management</CardTitle>
              </div>
              <CardDescription>
                Rapid situation reports (SITREPs) for cyclones, floods, and civic emergencies. Automatically aligns evacuation zones and relief shelter locations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-coral-soft text-coral">
                  <Building2 className="size-5" />
                </span>
                <CardTitle>Corporate Crisis &amp; Incident PR</CardTitle>
              </div>
              <CardDescription>
                Security breach advisories, product recalls, and stakeholder communications. Pins all public disclosures directly to technical audit logs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-sage-soft text-emerald-600">
                  <Scale className="size-5" />
                </span>
                <CardTitle>Legal &amp; Regulatory Compliance</CardTitle>
              </div>
              <CardDescription>
                Statutory disclosure notices, tribunal order summaries, and audit filings. Ensures absolute consistency with past regulatory precedents.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Sovereign Architecture Pillars */}
      <section className="py-16 border-t border-border/70 max-w-5xl mx-auto px-6 w-full space-y-10">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </span>
                <CardTitle>Grounded Fact Matrix</CardTitle>
              </div>
              <CardDescription>
                Extracts atomic claims with exact bounding box locators (`p1.b3`) from OCR and audio timestamps (`02:15.s1`).
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
                Outputs inverted pyramid releases and verified summaries in both English and Hindi without translation drift.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="p-2 rounded-lg bg-sage-soft text-emerald-600">
                  <ShieldCheck className="size-5" />
                </span>
                <CardTitle>Cryptographic Seal</CardTitle>
              </div>
              <CardDescription>
                Produces an immutable SHA-256 Merkle root. Anyone can verify document authenticity at `/verify/[seal]`.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}
