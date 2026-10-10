'use client';

import { useEffect, useState } from 'react';
import { apiGet } from './api';
import type { Quote } from '@/types/api';

export type AssetClass = 'Equity' | 'Crypto' | 'Currency' | 'Future' | 'Index';

const SUFFIX_EXCHANGE: Record<string, string> = {
  NS: 'NSE', BO: 'BSE', L: 'LSE', T: 'Tokyo', HK: 'HKEX', SI: 'SGX', TO: 'TSX', AX: 'ASX',
  DE: 'Xetra', PA: 'Euronext Paris', AS: 'Euronext Amsterdam', SW: 'SIX', MI: 'Borsa Italiana',
};

/** What a symbol is, from Yahoo symbology. Data is delayed unless it's crypto. */
export function describe(symbol: string): { assetClass: AssetClass; exchange: string | null; delay: string } {
  const s = symbol.toUpperCase();
  if (/-(USD|USDT|INR|EUR|GBP)$/.test(s)) return { assetClass: 'Crypto', exchange: null, delay: 'Near real-time' };
  if (s.endsWith('=X')) return { assetClass: 'Currency', exchange: 'FX', delay: 'Delayed' };
  if (s.endsWith('=F')) return { assetClass: 'Future', exchange: null, delay: '15m delayed' };
  if (s.startsWith('^')) return { assetClass: 'Index', exchange: null, delay: '15m delayed' };
  const suffix = s.includes('.') ? s.split('.').pop()! : '';
  return { assetClass: 'Equity', exchange: SUFFIX_EXCHANGE[suffix] ?? (suffix ? null : 'US'), delay: '15m delayed' };
}

/** Quotes in minor units (pence, cents) converted to the major currency. */
export function normalizeQuote(q: Quote | undefined | null): { price: number | null; currency: string } {
  const raw = q?.regularMarketPrice;
  const ccy = q?.currency ?? 'USD';
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return { price: null, currency: ccy.toUpperCase() };
  const minor: Record<string, string> = { GBp: 'GBP', GBX: 'GBP', ZAc: 'ZAR', ILA: 'ILS' };
  return minor[ccy] ? { price: raw / 100, currency: minor[ccy] } : { price: raw, currency: ccy.toUpperCase() };
}

/** Units of `to` per one unit of `from`, from a live FX quote. 1 when equal. */
export function useFxRate(from: string | null, to: string | null): number | null {
  const pair = from && to && from !== to ? `${from}${to}=X` : null;
  const [result, setResult] = useState<{ pair: string; rate: number | null } | null>(null);
  useEffect(() => {
    if (!pair) return;
    const controller = new AbortController();
    apiGet<Quote>(`/api/quote?symbol=${pair}`, controller.signal)
      .then((q) => setResult({ pair, rate: typeof q.regularMarketPrice === 'number' ? q.regularMarketPrice : null }))
      .catch((err) => { if ((err as Error).name !== 'AbortError') setResult({ pair, rate: null }); });
    return () => controller.abort();
  }, [pair]);
  if (from && to && from === to) return 1;
  return pair && result?.pair === pair ? result.rate : null;
}
