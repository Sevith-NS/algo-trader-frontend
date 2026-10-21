'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { LinkTabs } from '@/components/ui/Tabs';
import { usePortfolio } from '@/context/PortfolioContext';
import { usePortfolioSelection } from './selection';

const TABS = [
  { href: '/portfolio', label: 'Holdings', real: true },
  { href: '/portfolio/performance', label: 'Performance', real: true },
  { href: '/portfolio/activity', label: 'Activity', real: false },
  { href: '/portfolio/risk', label: 'Risk', real: false },
  { href: '/portfolio/journal', label: 'Journal', real: false },
];

/** Tabs that keep the selected book (`?p`). Real books only have tabs that read real data. */
export function PortfolioTabs() {
  const { selection, withSelection } = usePortfolioSelection();
  const real = selection.mode === 'real';
  return (
    <LinkTabs label="Portfolio sections"
              tabs={TABS.filter((t) => !real || t.real).map((t) => ({ href: withSelection(t.href), label: t.label }))} />
  );
}

/** A paper-only tab opened with a real book selected says so, instead of showing paper data under a real label. */
export function PaperOnlyGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { accounts } = usePortfolio();
  const { selection } = usePortfolioSelection();
  const paperOnly = TABS.some((t) => !t.real && pathname === t.href);
  if (!paperOnly || selection.mode !== 'real') return <>{children}</>;
  const paper = accounts.find((a) => a.kind === 'paper');
  return (
    <EmptyState title="This tab covers paper portfolios"
                action={paper && <ButtonLink href={`${pathname}?p=${paper.id}`} variant="secondary">Switch to {paper.name}</ButtonLink>}>
      Activity, risk and the journal come from your paper ledger. Real accounts show their synced holdings.
    </EmptyState>
  );
}
