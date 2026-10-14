import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { buildContext, getR2, getStore } from "@/server/context";
import { createAppRouter } from "@/server/trpc";

async function handler(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: createAppRouter(getStore(), getR2()),
    createContext: () => buildContext(),
  });
}

export { handler as GET, handler as POST };
