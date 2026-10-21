import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { PortfolioSwitcher } from '@/components/portfolio/PortfolioSwitcher';
import { PaperOnlyGuard, PortfolioTabs } from '@/components/portfolio/PortfolioTabs';
import { PortfolioPulse } from '@/components/portfolio/Summary';

export const metadata: Metadata = { title: 'Portfolio' };

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {/* The selected book lives in ?p, read with useSearchParams: hence the Suspense boundaries. */}
      <PageHeader level={1} title="Portfolio" className="mb-2" actions={<Suspense><PortfolioSwitcher /></Suspense>} />
      <Suspense><PortfolioPulse /></Suspense>
      <Suspense><PortfolioTabs /></Suspense>
      <Suspense><PaperOnlyGuard>{children}</PaperOnlyGuard></Suspense>
    </div>
  );
}
