"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore } from "@/server/context";
import { structureFacts } from "@/lib/press-facts/facts";
import { checkNeutrality } from "@/lib/press-facts/neutrality";
import { buildDraftBundle, ENGLISH_PHRASES } from "@/lib/press-facts/bundle";
import { isOk } from "@/lib/result/result";

export interface ActionResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

export async function createDocumentAction(formData: FormData): Promise<void> {
  const { userId, isAuthenticated } = await auth();
  if (!isAuthenticated || !userId) {
    throw new Error("Authentication required to create a press dossier.");
  }

  const title = formData.get("title");
  const tenantId = formData.get("tenantId") || "default-dept";

  if (typeof title !== "string" || !title.trim()) {
    throw new Error("Title is required.");
  }
  if (typeof tenantId !== "string" || !tenantId.trim()) {
    throw new Error("Tenant ID is required.");
  }

  const store = getStore();
  const tId = tenantId.trim();

  // Ensure author has membership in tenant
  const existingMembership = await store.getMembership({ userId, tenantId: tId });
  if (!existingMembership) {
    await store.addMembership({ userId, tenantId: tId, role: "approver" });
  }

  const doc = await store.create({
    tenantId: tId,
    title: title.trim(),
  });

  // Auto-create initial revision
  await store.addRevision({
    documentId: doc.id,
    revisionNumber: 1,
    authorId: userId,
    reason: "Initial dossier scaffolding",
    diff: { title: doc.title, status: doc.status },
  });

  revalidatePath("/dossiers");
  redirect(`/dossiers/${doc.id}`);
}

export async function approveDocumentAction(input: {
  documentId: string;
  tenantId: string;
  waitTokenId?: string;
}): Promise<ActionResult<{ status: string }>> {
  const { userId, isAuthenticated } = await auth();
  if (!isAuthenticated || !userId) {
    return { success: false, error: "Authentication required to approve a press note." };
  }

  try {
    const store = getStore();

    // Verify user is an approver in this tenant
    const membership = await store.getMembership({ userId, tenantId: input.tenantId });
    if (!membership || membership.role !== "approver") {
      return { success: false, error: "Only officers with the approver role can approve press notes." };
    }

    const approved = await store.approve({
      id: input.documentId,
      tenantId: input.tenantId,
      approvedBy: userId,
    });

    if (!approved) {
      return { success: false, error: "Document not found or tenant mismatch." };
    }

    if (input.waitTokenId) {
      try {
        const triggerSecretKey = process.env.TRIGGER_SECRET_KEY;
        if (triggerSecretKey) {
          await fetch(`https://api.trigger.dev/api/v1/waitpoints/tokens/${input.waitTokenId}/complete`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${triggerSecretKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: {
                status: "approved",
                approvedBy: userId,
                attestationConfirmed: true,
              },
            }),
          });
        }
      } catch (tokenErr) {
        console.error("Trigger waitpoint token completion note:", tokenErr);
      }
    }

    revalidatePath(`/dossiers/${input.documentId}`);
    revalidatePath("/dossiers");
    return { success: true, data: { status: approved.status } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to approve document" };
  }
}

export async function saveRevisionAction(input: {
  documentId: string;
  revisionNumber: number;
  reason: string;
  diff: Record<string, unknown>;
  factsSnapshot?: unknown;
  bundleSnapshot?: unknown;
}): Promise<ActionResult<{ revisionId: string }>> {
  const { userId, isAuthenticated } = await auth();
  if (!isAuthenticated || !userId) {
    return { success: false, error: "Authentication required to save revision." };
  }

  try {
    const store = getStore();
    const rev = await store.addRevision({
      documentId: input.documentId,
      revisionNumber: input.revisionNumber,
      authorId: userId,
      reason: input.reason,
      diff: input.diff,
      factsSnapshot: input.factsSnapshot,
      bundleSnapshot: input.bundleSnapshot,
    });

    revalidatePath(`/dossiers/${input.documentId}`);
    return { success: true, data: { revisionId: rev.id } };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save revision" };
  }
}

export async function processEvidenceAction(input: {
  documentId: string;
  rawText: string;
  sourceId: string;
}): Promise<ActionResult<{
  flags: ReturnType<typeof checkNeutrality>;
  bundle: ReturnType<typeof buildDraftBundle>;
}>> {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) {
    return { success: false, error: "Authentication required to analyze evidence." };
  }

  // 1. Run neutrality scan
  const flags = checkNeutrality(input.rawText);

  // 2. Build default fallback facts
  const spans = [{ sourceId: input.sourceId, locator: "evidence-1", text: input.rawText }];
  const factsRes = structureFacts({
    spans,
    claims: {
      event: [{ spanIndex: 0, value: input.rawText.slice(0, 80) }],
    },
  });

  if (!isOk(factsRes)) {
    return { success: false, error: "Fact structuring failed." };
  }

  // 3. Build draft bundle
  const bundle = buildDraftBundle(factsRes.value, ENGLISH_PHRASES);

  return {
    success: true,
    data: { flags, bundle },
  };
}
