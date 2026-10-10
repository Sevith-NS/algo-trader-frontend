/**
 * Server-side route protection.
 *
 * Until now the only thing between an anonymous visitor and the authenticated
 * app was the UI: Navigation hides its links behind `useSession()`, and the
 * community page renders a signed-out variant. Neither is enforcement — the
 * pages themselves rendered fine for anyone who typed the URL. This runs
 * before them and redirects to /login instead.
 *
 * Written against `getToken` rather than next-auth's `withAuth` wrapper: this
 * is Next's `proxy` convention (which replaced `middleware` in 16.x), and a
 * plain function keeps the redirect and the callbackUrl behaviour visible
 * instead of inherited.
 *
 * Public by design, and therefore absent from `matcher` below:
 *   /            the landing page
 *   /login       the sign-in page itself
 *   /community   has a built-in signed-out state, and its one mutation
 *                (createCommunityPost) already does its own getServerSession
 *                check server-side — the pattern the rest of the app lacked.
 *
 * NOTE: this is defence in depth, not a security boundary, while the
 * credentials provider still accepts any password for a known email. It stops
 * a drive-by, not someone who reads the login form.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  // Preserve where they were going so sign-in can land them back there.
  const login = new URL('/login', req.url);
  login.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portfolio/:path*',
    '/screener/:path*',
    '/movers/:path*',
    '/discover/:path*',
    '/markets/:path*',
    '/geotrade/:path*',
    '/news/:path*',
  ],
};
