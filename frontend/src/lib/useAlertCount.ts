'use client';

import { useEffect } from 'react';
import { useApi } from './useApi';

const SEEN_EVENT = 'polaris:alerts-seen';

/**
 * Unseen alert firings, for the bell. Polling this is also what makes the API
 * check the person's alerts (there is no background worker), so it runs once
 * a minute while the tab is visible.
 */
export function useAlertCount(): number {
  const { data, reload } = useApi<{ unseen: number }>('/api/alerts/firings?limit=1', { refreshMs: 60_000 });
  useEffect(() => {
    window.addEventListener(SEEN_EVENT, reload);
    return () => window.removeEventListener(SEEN_EVENT, reload);
  }, [reload]);
  return data?.unseen ?? 0;
}

/** Tell the bell that firings were marked seen, so it updates without waiting a minute. */
export function announceAlertsSeen() {
  window.dispatchEvent(new Event(SEEN_EVENT));
}
