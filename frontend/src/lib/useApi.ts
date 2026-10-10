'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './api';

export type ApiState<T> = {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
};

type Result<T> = { path: string | null; key: string; data?: T; error: unknown };

/**
 * Load one GET endpoint. Pass `null` to skip. A reload keeps the last good
 * data on screen (no blank flash); a different path never shows the previous
 * path's data. Stale requests are aborted.
 */
export function useApi<T>(path: string | null, { refreshMs }: { refreshMs?: number } = {}): ApiState<T> {
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result<T>>({ path: null, key: '', error: null });
  const key = `${path}#${nonce}`;

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    apiGet<T>(path, controller.signal)
      .then((data) => setResult({ path, key, data, error: null }))
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') setResult((prev) => ({ path, key, data: prev.path === path ? prev.data : undefined, error }));
      });
    return () => controller.abort();
  }, [path, key]);

  useEffect(() => {
    if (!refreshMs || path === null) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setNonce((n) => n + 1);
    }, refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs, path]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const samePath = result.path === path && path !== null;
  return {
    data: samePath ? result.data : undefined,
    error: samePath ? result.error : null,
    loading: path !== null && result.key !== key,
    reload,
  };
}

/** Run a POST as a query: re-runs when `body` changes (compare by JSON). */
export function usePostQuery<T>(path: string | null, body: unknown, post: (p: string, b: unknown) => Promise<T>): ApiState<T> {
  const [nonce, setNonce] = useState(0);
  const json = JSON.stringify(body ?? null);
  const key = `${path}#${json}#${nonce}`;
  const [result, setResult] = useState<{ key: string; base: string; data?: T; error: unknown }>({ key: '', base: '', error: null });

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    post(path, JSON.parse(json))
      .then((data) => { if (!cancelled) setResult({ key, base: json, data, error: null }); })
      .catch((error) => { if (!cancelled) setResult((prev) => ({ key, base: json, data: prev.base === json ? prev.data : undefined, error })); });
    return () => { cancelled = true; };
  }, [path, json, key, post]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return {
    data: result.base === json ? result.data : undefined,
    error: result.base === json ? result.error : null,
    loading: path !== null && result.key !== key,
    reload,
  };
}
