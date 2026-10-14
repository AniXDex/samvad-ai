import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import {
  FileText,
  FolderOpen,
  Plus,
  ShieldCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { getStore } from "@/server/context";
import { createDocumentAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function DossiersPage(): Promise<React.JSX.Element> {
  const { isAuthenticated, userId } = await auth();
  const user = isAuthenticated ? await currentUser() : null;

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-gold/15 flex items-center justify-center text-primary border border-primary/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-story font-semibold tracking-tight text-foreground">
            Officer Authorization Required
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Access to police incident dossiers and sovereign press note generation requires an authorized officer session.
          </p>
        </div>
        <SignInButton mode="modal">
          <Button variant="default" size="lg">
            Sign In to Police Portal
          </Button>
        </SignInButton>
      </div>
    );
  }

  const tenantId = "default-dept";
  const store = getStore();
  const documents = await store.list(tenantId, 50);

  const officerName = user?.fullName || user?.firstName || "Duty Officer";
  const draftCount = documents.filter((d) => d.status === "draft").length;
  const approvedCount = documents.filter((d) => d.status === "approved").length;

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 space-y-10">
      {/* Editorial Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              ← Portal Home
            </Link>
            <span className="text-border">•</span>
            <span className="text-xs text-muted-foreground font-mono">
              Unit: <span className="text-foreground">{tenantId}</span>
            </span>
            <span className="text-border">•</span>
            <Badge variant="sage" className="text-[10px] py-0 px-2 font-mono">
              Live Gateway
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-story font-semibold tracking-tight text-foreground">
            Incident Dossiers & Press Notes
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Logged in as <strong className="text-foreground font-medium">{officerName}</strong>. Manage FIR evidence, verify citation-pinned facts, and digitally certify bilingual releases.
          </p>
        </div>

        {/* Quick create action card */}
        <form
          action={createDocumentAction}
          className="flex items-center gap-2.5 p-2 bg-card rounded-xl ring-1 ring-foreground/10 shadow-xs"
        >
          <input type="hidden" name="tenantId" value={tenantId} />
          <Input
            name="title"
            placeholder="New Case (e.g. FIR 402/2026 Fraud)"
            className="w-56 sm:w-64 border-0 bg-transparent focus-visible:ring-0 shadow-none text-sm placeholder:text-muted-foreground/60"
            required
          />
          <Button type="submit" size="sm" className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />
            <span>Create Dossier</span>
          </Button>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Files
              </CardDescription>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-story font-semibold mt-1">{documents.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Registered in active tenant ledger
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                In Officer Review
              </CardDescription>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-3xl font-story font-semibold mt-1 text-primary">
              {draftCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Awaiting editorial fact verification
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sealed & Certified
              </CardDescription>
              <ShieldCheck className="w-4 h-4 text-foreground" />
            </div>
            <CardTitle className="text-3xl font-story font-semibold mt-1 text-foreground">
              {approvedCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Immutable SHA-256 seal stamped
          </CardContent>
        </Card>
      </div>

      {/* Dossier List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-story font-semibold tracking-tight text-foreground">
            Active Police Dossiers
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Showing {documents.length} records
          </span>
        </div>

        {documents.length === 0 ? (
          <Card className="border-dashed p-12 text-center space-y-4 bg-card/40">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="font-story font-medium text-base text-foreground">
                No case dossiers registered yet
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Use the create input above to initialize your first incident record and upload case evidence.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="hover:ring-foreground/20 hover:shadow-xs transition-all duration-200 bg-card group"
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dossiers/${doc.id}`}
                        className="font-story font-semibold text-lg text-foreground hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                      {doc.status === "approved" ? (
                        <Badge variant="sage" className="gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Sealed</span>
                        </Badge>
                      ) : (
                        <Badge variant="gold" className="gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Draft Review</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted/60 px-2 py-0.5 rounded text-[11px]">
                        {doc.id}
                      </span>
                      <span>•</span>
                      <span>Registered: {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/dossiers/${doc.id}`} />}
                      className="gap-1.5"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
