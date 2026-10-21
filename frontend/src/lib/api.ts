// Every backend call goes through this app's own server (app/api/backend),
// which attaches the signed-in user's Clerk token. The API's real address is
// server-only (FLINT_API_URL) and never reaches the browser.
export const API_BASE = '/api/backend';

/**
 * User-facing copy for any failed backend call. Deliberately generic: it names
 * no host, port, or run command, since it renders in the browser for end users.
 */
export const DATA_UNAVAILABLE =
  'Market data is temporarily unavailable. Please try again shortly.';

/** A failed API call, carrying the server's safe message and reference id. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string = 'error',
    readonly ref?: string,
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ErrorBody = { error?: string; code?: string; ref?: string };

async function request<T>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('You appear to be offline. Check your connection and try again.', 0, 'offline');
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as (T & ErrorBody) | null;
  if (!res.ok) {
    const retry = Number(res.headers.get('retry-after')) || undefined;
    throw new ApiError(data?.error || DATA_UNAVAILABLE, res.status, data?.code, data?.ref, retry);
  }
  return data as T;
}

export const apiGet = <T = unknown>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal);
export const apiPost = <T = unknown>(path: string, body: unknown) => request<T>('POST', path, body);
export const apiPatch = <T = unknown>(path: string, body: unknown) => request<T>('PATCH', path, body);
export const apiDelete = <T = unknown>(path: string, body?: unknown) => request<T>('DELETE', path, body);

/** Message to show a person for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.ref ? `${err.message} Reference ${err.ref}.` : err.message;
  return DATA_UNAVAILABLE;
}
