'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import type { HoldingsResponse } from '@/types/api';

type State = { key: string; data?: HoldingsResponse[]; error: unknown };

// The summary and the table mount together and want the same rows: share one
// request for a few seconds instead of fetching each account twice.
const SHARE_MS = 5000;
const shared = new Map<string, { at: number; promise: Promise<HoldingsResponse[]> }>();

function load(ids: string, fresh: boolean): Promise<HoldingsResponse[]> {
  const hit = shared.get(ids);
  if (!fresh && hit && Date.now() - hit.at < SHARE_MS) return hit.promise;
  const promise = Promise.all(ids.split(',').map((id) => apiGet<HoldingsResponse>(`/api/accounts/${id}/holdings`)));
  shared.set(ids, { at: Date.now(), promise });
  promise.catch(() => shared.delete(ids));
  return promise;
}

/** Synced holdings for one or more real accounts, fetched together. */
export function useRealHoldings(accountIds: string[]) {
  const ids = accountIds.join(',');
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<State>({ key: '', error: null });
  const key = `${ids}#${nonce}`;

  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    load(ids, nonce > 0)
      .then((data) => { if (!cancelled) setState({ key, data, error: null }); })
      .catch((error) => { if (!cancelled) setState((prev) => ({ key, data: prev.data, error })); });
    return () => { cancelled = true; };
  }, [ids, key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = state.key.split('#')[0] === ids;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : null,
    loading: Boolean(ids) && state.key !== key,
    reload,
  };
}
