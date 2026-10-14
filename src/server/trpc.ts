/**
 * tRPC foundation — router seam for the app.
 *
 * Interface: {@link createAppRouter} builds the router from an injected
 * {@link DocumentsStore}; context carries only the session
 * (`{ user: { id } } | null`), mapped from Clerk at the route layer.
 * `health` is public; everything else goes through `protectedProcedure`,
 * which rejects null sessions with UNAUTHORIZED before any store is touched.
 * Known gap (feat 5): tenant comes from validated input, not from a
 * memberships table + RLS — spoofing is contained by tests asserting the
 * 401 boundary, not by data-layer enforcement yet.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { documentId, tenantId, type R2Module } from "@/lib/r2/r2";
import { isOk } from "@/lib/result/result";
import { type DocumentsStore } from "./documents/store";

export interface Session {
  readonly user: { readonly id: string };
}

export interface Context {
  readonly session: Session | null;
}

const t = initTRPC.context<Context>().create();

const publicProcedure = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED", message: "sign-in required" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

const tenantInput = z
  .string()
  .refine((value: string): value is string => isOk(tenantId(value)), {
    message: "tenant id must match [A-Za-z0-9_-]{1,64}",
  });

const documentInput = z
  .string()
  .refine((value: string): value is string => isOk(documentId(value)), {
    message: "document id must match [A-Za-z0-9_-]{1,64}",
  });

export function createAppRouter(store: DocumentsStore, r2?: R2Module | null) {
  return t.router({
    health: publicProcedure.query(() => ({ status: "ok" as const, service: "samvaad-ai" as const })),

    documents: t.router({
      create: protectedProcedure
        .input(z.object({ tenantId: tenantInput, title: z.string().min(1).max(200) }))
        .mutation(({ input }) => store.create({ tenantId: input.tenantId, title: input.title })),

      list: protectedProcedure
        .input(z.object({ tenantId: tenantInput, limit: z.number().int().min(1).max(100).default(20) }))
        .query(({ input }) => store.list(input.tenantId, input.limit)),

      get: protectedProcedure
        .input(z.object({ tenantId: tenantInput, id: z.string().min(1) }))
        .query(async ({ input }) => {
          const doc = await store.get({ id: input.id, tenantId: input.tenantId });
          if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "document not found" });
          return doc;
        }),

      approve: protectedProcedure
        .input(z.object({ tenantId: tenantInput, id: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
          const approved = await store.approve({
            id: input.id,
            tenantId: input.tenantId,
            approvedBy: ctx.session.user.id,
          });
          if (!approved) throw new TRPCError({ code: "NOT_FOUND", message: "document not found" });
          return approved;
        }),

      addRevision: protectedProcedure
        .input(
          z.object({
            tenantId: tenantInput,
            documentId: z.string().min(1),
            revisionNumber: z.number().int().min(1),
            diff: z.record(z.string(), z.unknown()),
            reason: z.string().min(1).max(500),
            factsSnapshot: z.unknown().optional(),
            bundleSnapshot: z.unknown().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          return store.addRevision({
            documentId: input.documentId,
            revisionNumber: input.revisionNumber,
            authorId: ctx.session.user.id,
            diff: input.diff,
            reason: input.reason,
            factsSnapshot: input.factsSnapshot,
            bundleSnapshot: input.bundleSnapshot,
          });
        }),
    }),

    r2: t.router({
      mint: protectedProcedure
        .input(
          z.object({
            tenantId: tenantInput,
            documentId: documentInput,
            extension: z.string().min(1).max(10),
            contentType: z.string().min(1),
            contentLengthBytes: z.number().int().positive().max(500 * 1024 * 1024),
          })
        )
        .mutation(async ({ input }) => {
          if (!r2) throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "storage module not wired" });
          const tId = tenantId(input.tenantId);
          const dId = documentId(input.documentId);
          if (!isOk(tId) || !isOk(dId)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "invalid tenant or document id" });
          }
          const grant = await r2.createUploadGrant({
            tenant: tId.value,
            document: dId.value,
            extension: input.extension,
            contentType: input.contentType,
            contentLengthBytes: input.contentLengthBytes,
          });
          if (!isOk(grant)) {
            if (grant.error.kind === "invalid-input") {
              throw new TRPCError({ code: "BAD_REQUEST", message: grant.error.issues.join(", ") });
            }
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "failed to mint upload grant" });
          }
          return grant.value;
        }),

      complete: protectedProcedure
        .input(
          z.object({
            tenantId: tenantInput,
            documentId: z.string().min(1),
            key: z.string().min(1),
            kind: z.enum(["form", "pdf", "image", "audio"]),
            sha256: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return store.addSource({
            documentId: input.documentId,
            kind: input.kind,
            r2Key: input.key,
            sha256: input.sha256,
          });
        }),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
