/**
 * Clerk session handling for every request.
 *
 * Protection is not decided here by URL pattern (Clerk deprecated that: path
 * matching can drift from how Next routes requests). Instead each protected
 * surface checks for itself on the server:
 *   - app/(app)/layout.tsx and app/onboarding/layout.tsx call auth.protect()
 *   - app/api/backend/* refuses any request without a session
 *   - the Flint API verifies the session token again on every call
 */
import { clerkMiddleware } from '@clerk/nextjs/server';

/**
 * Content-Security-Policy, minted per request. `strict` gives every response
 * a fresh nonce plus 'strict-dynamic': Next stamps the nonce on its own
 * scripts, and browsers then ignore host allowlists and 'unsafe-inline' for
 * script-src, so injected markup cannot run script. Clerk's defaults cover its
 * own hosts; the extra directives close plugins, <base> hijacking and framing.
 */
export default clerkMiddleware({
  contentSecurityPolicy: {
    strict: true,
    directives: {
      'object-src': ['none'],
      'base-uri': ['self'],
      'frame-ancestors': ['none'],
      // Clerk's sign-in card draws a data: SVG. Images cannot run script.
      'img-src': ['data:'],
    },
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files unless found in search params.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
