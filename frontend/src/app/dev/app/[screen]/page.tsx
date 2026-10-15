import { notFound } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import Home from '@/app/(app)/home/page';
import MarketsLayout from '@/app/(app)/markets/layout';
import MarketsPage from '@/app/(app)/markets/page';
import NewsPage from '@/app/(app)/news/page';
import PortfolioLayout from '@/app/(app)/portfolio/layout';
import Holdings from '@/app/(app)/portfolio/page';
import Risk from '@/app/(app)/portfolio/risk/page';
import BrokerCallback from '@/app/(app)/settings/brokers/callback/page';
import Settings from '@/app/(app)/settings/page';
import { AppShell } from '@/components/shell/AppShell';
import { SymbolView } from '@/components/symbol/SymbolView';
import { ToastProvider } from '@/components/ui/Toast';
import { PortfolioProvider } from '@/context/PortfolioContext';

/**
 * Development-only: the real signed-in screens inside the real shell and
 * providers, without the auth gate, so layout can be checked without a Clerk
 * session. Data calls fail without a session, which also shows the error
 * states. 404 in production.
 */
const SCREENS: Record<string, () => ReactNode> = {
  home: () => <Home />,
  markets: () => <MarketsLayout><MarketsPage /></MarketsLayout>,
  portfolio: () => <PortfolioLayout><Holdings /></PortfolioLayout>,
  risk: () => <PortfolioLayout><Risk /></PortfolioLayout>,
  news: () => <NewsPage />,
  settings: () => <Settings />,
  'broker-callback': () => <BrokerCallback />,
  symbol: () => <SymbolView symbol="RELIANCE.NS" />,
};

export default async function DevScreen({ params }: { params: Promise<{ screen: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound();
  const render = SCREENS[(await params).screen];
  if (!render) notFound();
  return (
    <ToastProvider>
      <PortfolioProvider>
        <AppShell><Suspense>{render()}</Suspense></AppShell>
      </PortfolioProvider>
    </ToastProvider>
  );
}
