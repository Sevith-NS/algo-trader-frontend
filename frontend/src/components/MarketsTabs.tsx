'use client';

import { Suspense } from 'react';
import { LinkTabs } from '@/components/ui/Tabs';

/** The Markets section's five views. Each is its own URL. */
const VIEWS = [
  { href: '/markets', label: 'Overview' },
  { href: '/markets/movers', label: 'Movers' },
  { href: '/markets/ideas', label: 'Ideas' },
  { href: '/markets/levels', label: 'Levels' },
  { href: '/markets/screens', label: 'Screens' },
];

export default function MarketsTabs() {
  return (
    <Suspense>
      <LinkTabs label="Markets views" tabs={VIEWS} />
    </Suspense>
  );
}
