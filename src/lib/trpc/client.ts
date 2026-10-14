/**
 * tRPC client — factories only, no module-scope singletons (Next.js App
 * Router requires per-request clients; a shared global leaks users).
 */
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import type { AppRouter } from "@/server/trpc";

export function createApiClient(url: string): ReturnType<typeof createTRPCClient<AppRouter>> {
  return createTRPCClient<AppRouter>({ links: [httpBatchLink({ url })] });
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  });
}
