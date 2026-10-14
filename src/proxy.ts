/**
 * Clerk proxy — bare clerkMiddleware per the clerk-nextjs-patterns skill.
 *
 * Keep the middleware bare (no createRouteMatcher — deprecated in v7);
 * protection happens per page/handler via `await auth.protect()`.
 * Next 16 uses `proxy.ts`; Next <=15 uses `middleware.ts` (identical body).
 */
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
