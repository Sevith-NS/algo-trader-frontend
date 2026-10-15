/**
 * Backend-for-frontend: the only way the browser reaches the Polaris API.
 *
 * The browser calls /api/backend/api/<route> on this origin. This handler runs
 * on the Next.js server, swaps the Clerk session cookie for a short-lived
 * session token, and forwards the request to the private API. So:
 *  - the API URL never ships to the browser, and the API needs no CORS;
 *  - no token is ever handled by client-side code or stored in localStorage;
 *  - every request is authenticated before it leaves this server.
 *
 * Because the session rides a cookie here, state-changing methods must come
 * from this origin: cross-site requests are refused (CSRF).
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';

const API_URL = process.env.FLINT_API_URL ?? 'http://127.0.0.1:5000';
const MAX_BODY_BYTES = 1024 * 1024;
const SEGMENT = /^[A-Za-z0-9._\-=&^]+$/;

// Response headers worth passing back; everything else stays server-side.
const PASS_HEADERS = [
  'content-type', 'cache-control', 'retry-after', 'content-disposition', 'x-request-id',
];

type Ctx = { params: Promise<{ path: string[] }> };

function fail(status: number, error: string, code: string) {
  return NextResponse.json({ error, code }, { status, headers: { 'cache-control': 'no-store' } });
}

function sameOrigin(req: NextRequest): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const origin = req.headers.get('origin');
  return origin === null ? site === 'same-origin' : origin === req.nextUrl.origin;
}

async function forward(req: NextRequest, { params }: Ctx) {
  const { path } = await params;
  // Only /api/... on the backend, and no traversal or odd characters.
  if (path[0] !== 'api' || path.some((s) => s === '.' || s === '..' || !SEGMENT.test(s))) {
    return fail(404, 'Not found.', 'not_found');
  }
  if (req.method !== 'GET' && !sameOrigin(req)) {
    return fail(403, 'This request did not come from Polaris.', 'forbidden');
  }

  const { userId, getToken } = await auth();
  if (!userId) return fail(401, 'Sign in to continue.', 'unauthorized');
  const token = await getToken();
  if (!token) return fail(401, 'Your session has expired. Sign in again.', 'unauthorized');

  let body: ArrayBuffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const declared = Number(req.headers.get('content-length') ?? 0);
    if (declared > MAX_BODY_BYTES) return fail(413, 'Request body is too large.', 'too_large');
    body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return fail(413, 'Request body is too large.', 'too_large');
  }

  const target = new URL(`${API_URL}/${path.map(encodeURIComponent).join('/')}`);
  target.search = req.nextUrl.search;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: req.headers.get('accept') ?? 'application/json',
        ...(body ? { 'content-type': req.headers.get('content-type') ?? 'application/json' } : {}),
      },
      body,
      cache: 'no-store',
      redirect: 'manual',
      signal: req.signal,
    });
  } catch {
    return fail(503, 'Polaris is unavailable right now. Try again shortly.', 'unavailable');
  }

  const headers = new Headers();
  for (const name of PASS_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Streams (SSE) pass straight through, unbuffered.
  return new Response(upstream.body, { status: upstream.status, headers });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
export const dynamic = 'force-dynamic';
