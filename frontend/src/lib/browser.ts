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

/*
 * Browser storage is per user. Several people can sign in on one browser, so
 * every key Polaris stores is namespaced by the signed-in Clerk user id (set by
 * <UserStorage> before the app renders), and entries left by anyone else are
 * removed on sign-in. Nothing here is a secret: it is recent searches, chart
 * drawings and display preferences, all of which still must not leak.
 */
let storageUser: string | null = null;

/** Called by <UserStorage> while rendering, so children read the right namespace. */
export function setStorageUser(userId: string) {
  if (typeof window !== 'undefined') storageUser = userId;
}

const PREFIX = 'flint:u:';
const scoped = (key: string) => (storageUser ? `${PREFIX}${storageUser}:${key}` : null);

/** Read a stored value for the signed-in user; storage can be missing or blocked. */
export function readStorage(key: string): string | null {
  const k = scoped(key);
  if (!k) return null;
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  const k = scoped(key);
  if (!k) return;
  try {
    window.localStorage.setItem(k, value);
  } catch {
    /* convenience only */
  }
}

export function removeStorage(key: string) {
  const k = scoped(key);
  if (!k) return;
  try {
    window.localStorage.removeItem(k);
  } catch {
    /* convenience only */
  }
}

/** Drop every Polaris entry that is not the signed-in user's, including pre-scoping keys. */
export function purgeOtherUsers() {
  if (!storageUser) return;
  const own = `${PREFIX}${storageUser}:`;
  try {
    const store = window.localStorage;
    const stale: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && (k.startsWith('flint') || k.startsWith(PREFIX)) && !k.startsWith(own)) stale.push(k);
    }
    stale.forEach((k) => store.removeItem(k));
  } catch {
    /* storage blocked: nothing was stored either */
  }
}
