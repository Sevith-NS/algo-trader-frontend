import 'server-only';
import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.FLINT_API_URL ?? 'http://127.0.0.1:5000';

/**
 * Call the Polaris API from a server component or layout, as the signed-in user.
 * Returns null on any failure; callers decide what an outage means for them.
 */
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
