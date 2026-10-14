import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { getStore } from "@/server/context";
import { Button } from "@/components/ui/button";
import { ReviewEditor, type DocumentDetail } from "@/components/dossier/review-editor";

interface DossierPageProps {
  readonly params: Promise<{ id: string }>;
}

export default async function DossierDetailPage({ params }: DossierPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Officer Authorization Required</h1>
        <p className="text-muted-foreground max-w-md">
          Accessing case evidence and editorial sign-off requires an authorized session.
        </p>
        <SignInButton mode="modal">
          <Button variant="default">Sign In to Continue</Button>
        </SignInButton>
      </div>
    );
  }

  const tenantId = "default-dept";
  const store = getStore();
  const doc = await store.get({ id, tenantId });

  if (!doc) {
    notFound();
  }

  const detail: DocumentDetail = {
    id: doc.id,
    tenantId: doc.tenantId,
    title: doc.title,
    status: doc.status,
    createdAt: doc.createdAt,
    sources: doc.sources.map((s) => ({
      id: s.id,
      documentId: s.documentId,
      kind: s.kind,
      r2Key: s.r2Key,
      sha256: s.sha256,
      metadata: s.metadata,
      createdAt: s.createdAt,
    })),
    revisions: doc.revisions.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      revisionNumber: r.revisionNumber,
      diff: r.diff,
      factsSnapshot: r.factsSnapshot,
      bundleSnapshot: r.bundleSnapshot,
      authorId: r.authorId,
      reason: r.reason,
      approved: r.approved,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      createdAt: r.createdAt,
    })),
  };

  return <ReviewEditor initialDoc={detail} currentUserId={userId} />;
}
