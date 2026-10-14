import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

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
    <div className="flex-1 flex flex-col bg-background text-foreground">
      {/* Hero / Header Section */}
      <section className="relative border-b border-border/40 bg-radial from-primary/[0.04] to-transparent py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-6 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Clerk Authentication Active • Samvaad AI Sovereign System
          </div>

          {!isAuthenticated ? (
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Turn raw case evidence into{" "}
                <span className="text-primary underline decoration-primary/40 underline-offset-8">
                  verified, neutral
                </span>{" "}
                press notes.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                Samvaad AI equips government and police press officers to extract facts from FIR PDFs,
                audio briefings, and incident logs into dual-language drafts (English & Hindi) —
                guaranteeing zero premature declarations of guilt with complete human editorial control.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <SignInButton mode="modal">
                  <button className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-base hover:bg-primary/90 transition-all shadow-md hover:shadow-lg cursor-pointer">
                    Sign In to Officer Portal
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-6 py-3 rounded-lg border border-border bg-card text-foreground font-medium text-base hover:bg-accent transition-all cursor-pointer">
                    Create Officer Account
                  </button>
                </SignUpButton>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
                <div className="flex items-center gap-4">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-14 h-14 ring-2 ring-primary/20",
                      },
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight">
                        Welcome back, {officerName}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Authorized Officer
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {officerEmail} • User ID: <code className="font-mono text-xs">{userId}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Session Verified by Clerk
                  </span>
                </div>
              </div>

              {/* Officer Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-xl border border-border bg-card/60 hover:bg-card transition-all space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    01
                  </div>
                  <h3 className="font-semibold text-base">New Press Dossier</h3>
                  <p className="text-xs text-muted-foreground">
                    Scaffold a new case dossier with strict tenant isolation and source tracking.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-border bg-card/60 hover:bg-card transition-all space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    02
                  </div>
                  <h3 className="font-semibold text-base">Upload FIR & Audio</h3>
                  <p className="text-xs text-muted-foreground">
                    Direct-to-R2 presigned upload for PDFs, voice recordings, and incident images.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-border bg-card/60 hover:bg-card transition-all space-y-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    03
                  </div>
                  <h3 className="font-semibold text-base">Review & Sign Off</h3>
                  <p className="text-xs text-muted-foreground">
                    Laya fact verification check, dual-language summary preview, and final publish approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* System Features & Architectural Integrity */}
      <section className="py-16 max-w-6xl mx-auto px-6 w-full space-y-12">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Sovereign Architecture Principles
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Built for the IEEE-IGNITE SKIT005 problem statement: strictly auditable, legally compliant,
            and built on sovereign deep modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
              ⚖️
            </div>
            <h3 className="font-semibold text-lg">Zero Guilt Declaration</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Scans for accusatory language before conviction. Enforces &quot;alleged&quot; and factual attribution to uphold legal integrity.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              🇮🇳
            </div>
            <h3 className="font-semibold text-lg">Dual-Language Bundles</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Automatically generates 3 headline candidates (&le;15 words each), an inverted pyramid brief, and full summaries in English &amp; Hindi.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              🔍
            </div>
            <h3 className="font-semibold text-lg">Source Traceability</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every factual assertion links directly to its source paragraph, timestamped audio transcript, or official FIR record.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <h3 className="font-semibold text-lg">Human-in-the-Loop</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No press note is ever published automatically. An authenticated officer must edit, verify, and digitally approve every draft.
            </p>
          </div>
        </div>

        {/* Integration Status Badges */}
        <div className="p-6 rounded-xl border border-border/80 bg-muted/40 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Core Infrastructure Status
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>
                <strong>Clerk Auth:</strong> Connected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>
                <strong>Neon DB:</strong> Postgres 16
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>
                <strong>Cloudflare R2:</strong> S3 Compatible
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>
                <strong>tRPC 11:</strong> Protected Procedures
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
