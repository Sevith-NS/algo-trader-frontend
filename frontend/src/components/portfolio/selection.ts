'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import type { Account } from '@/types/api';

/** `?p=` value for the consolidated view of every real account. */
export const ALL_REAL = 'real';

export type Selection =
  | { mode: 'paper'; key: string; account: Account }
  | { mode: 'real'; key: string; accounts: Account[]; label: string }
  | { mode: 'none'; key: '' };

/**
 * Which book the Portfolio pages show, from `?p=` (an account id, or `real`
 * for all real accounts together). Without `?p` it is the paper account, or
 * the real ones when there is no paper account. Switching is always explicit:
 * only the switcher writes `?p`.
 */
export function usePortfolioSelection(): { selection: Selection; select: (key: string) => void; withSelection: (href: string) => string } {
  const { accounts } = usePortfolio();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const p = params.get('p');

  const real = accounts.filter((a) => a.kind === 'real');
  const paper = accounts.filter((a) => a.kind === 'paper');
  const byId = accounts.find((a) => a.id === p);

  let selection: Selection = { mode: 'none', key: '' };
  if (byId?.kind === 'paper') selection = { mode: 'paper', key: byId.id, account: byId };
  else if (byId?.kind === 'real') selection = { mode: 'real', key: byId.id, accounts: [byId], label: byId.name };
  else if (p === ALL_REAL && real.length) selection = { mode: 'real', key: ALL_REAL, accounts: real, label: 'All real' };
  else if (paper[0]) selection = { mode: 'paper', key: paper[0].id, account: paper[0] };
  else if (real.length) selection = { mode: 'real', key: ALL_REAL, accounts: real, label: 'All real' };

  const withSelection = useCallback(
    (href: string) => (p ? `${href}?p=${encodeURIComponent(p)}` : href), [p]);

  const select = useCallback((key: string) => {
    router.replace(`${pathname}?p=${encodeURIComponent(key)}`, { scroll: false });
  }, [pathname, router]);

  return { selection, select, withSelection };
}
