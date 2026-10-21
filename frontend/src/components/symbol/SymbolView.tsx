'use client';

import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import TradingDeskSection from '@/components/agents/TradingDeskSection';
import BacktestSection from '@/components/backtest/BacktestSection';
import DeepAnalysisSection from '@/components/intel/DeepAnalysisSection';
import NewsIntelPanel from '@/components/intel/NewsIntelPanel';
import { rememberSymbol } from '@/components/shell/CommandPalette';
import { Button } from '@/components/ui/Button';
import { Change } from '@/components/ui/Change';
import { DataChip, ErrorState, LoadingBlock, Skeleton } from '@/components/ui/States';
import { LinkTabs } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { errorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { useNow } from '@/lib/browser';
import { describe, normalizeQuote, useFxRate } from '@/lib/instrument';
import { exchangeFor, sessionState } from '@/lib/sessions';
import { sizeByRisk } from '@/lib/sizing';
import { useApi } from '@/lib/useApi';
import { WATCHLIST_CHANGED, addToWatchlist, removeFromWatchlist } from '@/lib/watchlist';
import type { Quote, Watchlist } from '@/types/api';
import type { Failed, NewsIntel } from '@/types/intel';
import type { MlInsights, QuantSignals } from '@/types/quant';
import { ChartPanel } from './ChartPanel';
import { OrderTicket } from './OrderTicket';
import { KeyStats, PlanDetail, PlanSummary } from './PlanPanels';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plan', label: 'Plan' },
  { id: 'desk', label: 'AI desk' },
  { id: 'backtest', label: 'Backtest' },
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'news', label: 'News' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function Session({ symbol }: { symbol: string }) {
  const now = useNow();
  const ex = exchangeFor(symbol);
  if (!now || !ex) return null;
  const label = ex === 'crypto' ? { open: true, text: 'Trading 24/7' }
    : (() => { const s = sessionState(ex, now); return { open: s.open, text: `${ex.name} ${s.open ? 'open' : 'closed'}` }; })();
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-caption', label.open ? 'text-up' : 'text-fg-2')}>
      <span aria-hidden="true" className={clsx('h-1.5 w-1.5 rounded-full', label.open ? 'bg-up' : 'border border-fg-3')} />
      {label.text}
    </span>
  );
}

export function SymbolView({ symbol }: { symbol: string }) {
  const params = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'overview') as TabId;
  const enc = encodeURIComponent(symbol);
  const info = describe(symbol);
  const fractional = info.assetClass === 'Crypto';

  const quoteApi = useApi<Quote>(`/api/quote?symbol=${enc}`, { refreshMs: 30_000 });
  const quantApi = useApi<QuantSignals>(`/api/quant-signals?symbol=${enc}`);
  const mlApi = useApi<MlInsights>(tab === 'plan' ? `/api/ml-insights?symbol=${enc}` : null);
  const newsApi = useApi<NewsIntel | Failed>(tab === 'news' ? `/api/news-intel?symbol=${enc}` : null);

  const { profile, book } = usePortfolio();
  const { price, currency } = normalizeQuote(quoteApi.data);
  const base = book?.account.currency ?? null;
  const fx = useFxRate(quoteApi.data ? currency : null, base);
  const toast = useToast();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [watching, setWatching] = useState(false);

  useEffect(() => { rememberSymbol(symbol); }, [symbol]);

  const levels = quantApi.data?.levels;
  const size = useMemo(() => {
    if (!book || !profile || !levels?.entry || !levels.stop_loss || !fx) return null;
    const invested = book.positions.reduce((s, p) => s + Number(p.market_value ?? p.cost_basis), 0);
    return sizeByRisk({
      equityBase: Number(book.cash) + invested, cashBase: Number(book.cash),
      riskPct: Number(profile.risk_per_trade_pct), entry: levels.entry, stop: levels.stop_loss, fx, fractional,
    });
  }, [book, profile, levels, fx, fractional]);

  const listsApi = useApi<{ watchlists: Watchlist[] }>('/api/watchlists');
  const reloadLists = listsApi.reload;
  useEffect(() => {
    window.addEventListener(WATCHLIST_CHANGED, reloadLists);
    return () => window.removeEventListener(WATCHLIST_CHANGED, reloadLists);
  }, [reloadLists]);
  const holding = (listsApi.data?.watchlists ?? []).filter((w) => w.symbols.includes(symbol)).map((w) => w.id);

  const toggleWatch = async () => {
    setWatching(true);
    try {
      if (holding.length) {
        await removeFromWatchlist(symbol, holding);
        toast.show({
          message: holding.length > 1 ? `${symbol} removed from ${holding.length} watchlists` : `${symbol} removed from your watchlist`,
          action: { label: 'Undo', onClick: () => { void Promise.all(holding.map((id) => addToWatchlist(symbol, id))).catch((err) => toast.show({ message: errorMessage(err), tone: 'error' })); } },
        });
      } else {
        await addToWatchlist(symbol, listsApi.data?.watchlists[0]?.id);
        toast.show({ message: `${symbol} added to your watchlist` });
      }
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    } finally {
      setWatching(false);
    }
  };

  const q = quoteApi.data;
  const unknown = quoteApi.error && !q;

  return (
    <div className="flex flex-col gap-6">
      <header className="glass flex flex-col gap-4 rounded-2xl p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="ticker text-h4">{symbol}</h1>
          {q?.shortName && q.shortName !== symbol && <span className="text-body-sm text-fg-2">{q.shortName}</span>}
          <span className="pill text-fg-2">{info.assetClass}</span>
          {(info.exchange || q) && (
            <span className="text-caption text-fg-3">{[info.exchange, q ? currency : null].filter(Boolean).join(' · ')}</span>
          )}
        </div>

        {unknown ? (
          <ErrorState error={quoteApi.error} title={`No market data for ${symbol}`} onRetry={quoteApi.reload} />
        ) : (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              {q ? (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-silver text-figure tabular md:text-[56px] md:leading-[60px]" aria-live="off">{formatMoney(price, currency)}</span>
                  <Change pct={q.regularMarketChangePercent}
                          amount={price != null && q.previousClose ? price - normalizeQuote({ ...q, regularMarketPrice: q.previousClose }).price! : null}
                          currency={currency} className="text-body" />
                </div>
              ) : <Skeleton className="h-9 w-56" />}
              <div className="flex flex-wrap items-center gap-3">
                <Session symbol={symbol} />
                {q && <DataChip stale={q.stale}>{q.stale ? 'Stale price, provider unavailable' : `Yahoo · ${info.delay}`}</DataChip>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={toggleWatch} loading={watching} disabled={!listsApi.data && !listsApi.error}>
                {holding.length ? 'Remove from watchlist' : 'Add to watchlist'}
              </Button>
              <Button variant="paper" onClick={() => setTicketOpen(true)} disabled={!q || price === null}>Paper trade</Button>
            </div>
          </div>
        )}
      </header>

      <LinkTabs label="Symbol sections"
                tabs={TABS.map((t) => ({ href: t.id === 'overview' ? `/s/${enc}` : `/s/${enc}?tab=${t.id}`, label: t.label }))} />

      {!unknown && (
        <div className="min-h-[50vh]">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <ChartPanel symbol={symbol} levels={levels} />
              <div className="flex flex-col gap-4">
                {quantApi.loading && !quantApi.data ? <LoadingBlock lines={7} label="Loading trade plan" /> : (
                  <PlanSummary quant={quantApi.data} currency={currency} size={size} baseCurrency={base ?? currency}
                               riskPct={profile ? Number(profile.risk_per_trade_pct) : null}
                               onTrade={() => setTicketOpen(true)} canTrade={Boolean(q && price !== null)} fractional={fractional} />
                )}
                <KeyStats quote={q ? { ...q, previousClose: q.previousClose } : undefined} currency={currency} />
              </div>
            </div>
          )}
          {tab === 'plan' && (
            quantApi.loading && !quantApi.data ? <LoadingBlock lines={8} label="Loading plan" />
              : quantApi.error ? <ErrorState error={quantApi.error} onRetry={quantApi.reload} />
              : <PlanDetail quant={quantApi.data} ml={mlApi.data} currency={currency} />
          )}
          {tab === 'desk' && <TradingDeskSection symbol={symbol} currency={currency} />}
          {tab === 'backtest' && <BacktestSection symbol={symbol} currency={currency} />}
          {tab === 'fundamentals' && <DeepAnalysisSection symbol={symbol} currency={currency} />}
          {tab === 'news' && (
            newsApi.loading && !newsApi.data ? <LoadingBlock lines={6} label="Loading news" />
              : newsApi.error ? <ErrorState error={newsApi.error} onRetry={newsApi.reload} />
              : <NewsIntelPanel data={newsApi.data} />
          )}
        </div>
      )}

      <p className="text-caption text-fg-3 lg:hidden">Paper trading. Educational, not investment advice.</p>

      <OrderTicket open={ticketOpen} onClose={() => setTicketOpen(false)} symbol={symbol} price={price}
                   currency={currency} fx={fx} suggested={size?.quantity ?? null}
                   planStop={levels?.stop_loss ?? null} fractional={fractional} />
    </div>
  );
}
