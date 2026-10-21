import 'server-only';
import { auth } from '@clerk/nextjs/server';

const API_URL = (process.env.FLINT_API_URL ?? 'http://127.0.0.1:5000').replace(/\/+$/, '');

/**
 * Call the Polaris API from a server component or layout, as the signed-in user.
 * Returns null on any failure; callers decide what an outage means for them.
 */
/**
 * Call one of the API's unauthenticated /api/public routes (the landing page's
 * market snapshot). Cached on this server for `revalidate` seconds, so visitors
 * never reach the API directly; null on any failure or a slow answer.
 */
export async function publicGet<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function serverGet<T>(path: string): Promise<T | null> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
