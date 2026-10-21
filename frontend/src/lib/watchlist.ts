'use client';

import { apiDelete, apiGet, apiPost } from './api';
import type { Watchlist } from '@/types/api';

/** Fired after any add or remove, so every watchlist view on screen reloads. */
export const WATCHLIST_CHANGED = 'polaris:watchlist-changed';

/**
 * Add a symbol to the person's first watchlist, creating it on first use.
 * Pass `listId` when the caller already knows it, to skip a lookup.
 */
export async function addToWatchlist(symbol: string, listId?: string): Promise<string> {
  let id = listId;
  if (!id) {
    const { watchlists } = await apiGet<{ watchlists: Watchlist[] }>('/api/watchlists');
    id = watchlists[0]?.id ?? (await apiPost<{ id: string }>('/api/watchlists', { name: 'Watchlist' })).id;
  }
  await apiPost(`/api/watchlists/${id}/items`, { symbol });
  window.dispatchEvent(new Event(WATCHLIST_CHANGED));
  return id;
}

/** Remove a symbol from the given lists (every list holding it, usually). */
export async function removeFromWatchlist(symbol: string, listIds: string[]): Promise<void> {
  await Promise.all(listIds.map((id) => apiDelete(`/api/watchlists/${id}/items/${encodeURIComponent(symbol)}`)));
  window.dispatchEvent(new Event(WATCHLIST_CHANGED));
}
