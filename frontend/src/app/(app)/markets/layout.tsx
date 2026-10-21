import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import MarketsTabs from '@/components/MarketsTabs';

export const metadata: Metadata = { title: 'Markets' };

export default function MarketsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-silver text-h2 font-normal tracking-[-0.03em] md:text-[40px] md:leading-[44px]">Markets</h1>
        <p className="text-body-sm text-fg-2">Candidates, not calls. Delayed data; paper trading only.</p>
      </div>
      <MarketsTabs />
      {children}
    </div>
  );
}
