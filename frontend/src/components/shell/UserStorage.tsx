'use client';

import { useEffect, type ReactNode } from 'react';
import { purgeOtherUsers, setStorageUser } from '@/lib/browser';

/**
 * Scopes browser storage to the signed-in user. The namespace is set while
 * rendering, before any child reads storage; entries belonging to anyone else
 * who used this browser (and pre-scoping keys) are removed after mount.
 */
export function UserStorage({ userId, children }: { userId: string; children: ReactNode }) {
  setStorageUser(userId);
  useEffect(() => { purgeOtherUsers(); }, [userId]);
  return children;
}
