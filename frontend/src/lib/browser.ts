'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/** A value only the browser knows. Renders `serverValue` until hydrated. */
export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue);
}

/** Whether a media query matches, kept in sync as the viewport changes. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** The current time, ticking every `intervalMs`. Null until hydrated, so server and client agree. */
export function useNow(intervalMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, intervalMs);
    return () => { window.clearTimeout(first); window.clearInterval(id); };
  }, [intervalMs]);
  return now;
}

/** Read a localStorage key safely; storage can be missing or blocked. */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* preference only */
  }
}
