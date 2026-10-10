import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import { PortfolioPulse } from '@/components/portfolio/Summary';
import { LinkTabs } from '@/components/ui/Tabs';

export const metadata: Metadata = { title: 'Portfolio' };

const TABS = [
  { href: '/portfolio', label: 'Holdings' },
  { href: '/portfolio/activity', label: 'Activity' },
  { href: '/portfolio/risk', label: 'Risk' },
  { href: '/portfolio/journal', label: 'Journal' },
];

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h3 font-bold">Portfolio</h1>
      <PortfolioPulse />
      <Suspense><LinkTabs label="Portfolio sections" tabs={TABS} /></Suspense>
      {children}
    </div>
  );
}
