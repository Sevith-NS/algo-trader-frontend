/**
 * Server-side route protection, backed by Clerk.
 *
 * Runs before every matched request. Anything in `isProtectedRoute` requires
 * a verified Clerk session; signed-out visitors are sent to /sign-in and
 * returned to where they were going afterwards. Unlike the old next-auth
 * guard, this is a real boundary: Clerk verifies the session token
 * server-side, so there is no password-less shortcut around it.
 *
 * Public by design: / (landing), /sign-in, /sign-up, /community (has a
 * signed-out state; its mutation checks auth itself).
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/portfolio(.*)',
  '/screener(.*)',
  '/movers(.*)',
  '/discover(.*)',
  '/markets(.*)',
  '/geotrade(.*)',
  '/news(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
