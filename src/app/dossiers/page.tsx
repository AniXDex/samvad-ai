import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Officer Sign-in Required</h1>
        <p className="text-muted-foreground max-w-md">
          Access to police incident dossiers and sovereign press note generation requires an authorized officer session.
        </p>
        <SignInButton mode="modal">
          <Button variant="default">Sign In to Continue</Button>
        </SignInButton>
      </div>
    );
  }

  const tenantId = "default-dept";
  const store = getStore();
  const documents = await store.list(tenantId, 50);

  const officerName = user?.fullName || user?.firstName || "Officer";

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
              ← Portal Home
            </Link>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-mono">Tenant: {tenantId}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Case Dossiers & Press Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, {officerName}. Manage case evidence, review extracted facts, and digitally sign press briefings.
          </p>
        </div>

        {/* Quick create action */}
        <form action={createDocumentAction} className="flex items-center gap-2">
          <input type="hidden" name="tenantId" value={tenantId} />
          <Input
            name="title"
            placeholder="e.g. Cyber Fraud FIR 402/2026"
            className="w-64"
            required
          />
          <Button type="submit">Create Dossier</Button>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Total Dossiers</CardDescription>
            <CardTitle className="text-2xl font-bold">{documents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Pending Review</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {documents.filter((d) => d.status === "draft").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Approved & Sealed</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {documents.filter((d) => d.status === "approved").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Dossier List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Active Press Dossiers</h2>

        {documents.length === 0 ? (
          <Card className="border-dashed p-12 text-center space-y-3">
            <p className="text-muted-foreground">No case dossiers created yet for this department.</p>
            <p className="text-xs text-muted-foreground">
              Enter a case title above to scaffold your first press briefing dossier.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:bg-muted/40 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dossiers/${doc.id}`}
                        className="font-semibold text-base hover:underline hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                      {doc.status === "approved" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Approved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Draft (Review Required)
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>ID: <code className="font-mono">{doc.id}</code></span>
                      <span>•</span>
                      <span>Created: {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" render={<Link href={`/dossiers/${doc.id}`} />}>
                      Open Review Workspace →
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
