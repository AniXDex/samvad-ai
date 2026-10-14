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
import { tenantId } from "@/lib/r2/r2";
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

export function createAppRouter(store: DocumentsStore) {
  return t.router({
    health: publicProcedure.query(() => ({ status: "ok" as const, service: "samvaad-ai" as const })),
    documents: t.router({
      create: protectedProcedure
        .input(z.object({ tenantId: tenantInput, title: z.string().min(1).max(200) }))
        .mutation(({ input }) => store.create({ tenantId: input.tenantId, title: input.title })),
      list: protectedProcedure
        .input(z.object({ tenantId: tenantInput, limit: z.number().int().min(1).max(100).default(20) }))
        .query(({ input }) => store.list(input.tenantId, input.limit)),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
