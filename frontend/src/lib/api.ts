// Every backend call goes through this app's own server (app/api/backend),
// which attaches the signed-in user's Clerk token. The API's real address is
// server-only (FLINT_API_URL) and never reaches the browser.
export const API_BASE = '/api/backend';

/**
 * User-facing copy for any failed backend call. Deliberately generic: it names
 * no host, port, or run command, since it renders in the browser for end users.
 * Diagnostic detail belongs in console.error at the call site.
 */
export const DATA_UNAVAILABLE =
  'Market data is temporarily unavailable. Please try again shortly.';

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}
