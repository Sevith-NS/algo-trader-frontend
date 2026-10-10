import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { SymbolView } from '@/components/symbol/SymbolView';
import { LoadingBlock } from '@/components/ui/States';

const SYMBOL = /^[A-Za-z0-9^][A-Za-z0-9.\-=&^]{0,23}$/;

type Props = { params: Promise<{ symbol: string }> };

async function readSymbol(params: Props['params']) {
  const raw = decodeURIComponent((await params).symbol).trim();
  return SYMBOL.test(raw) ? raw.toUpperCase() : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await readSymbol(params)) ?? 'Symbol' };
}

export default async function SymbolPage({ params }: Props) {
  const symbol = await readSymbol(params);
  if (!symbol) notFound();
  return (
    <Suspense fallback={<LoadingBlock lines={8} label={`Loading ${symbol}`} />}>
      <SymbolView key={symbol} symbol={symbol} />
    </Suspense>
  );
}
