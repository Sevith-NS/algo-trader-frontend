'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, describedBy, inputClass } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { errorMessage } from '@/lib/api';
import { formatMoney, formatNumber } from '@/lib/format';

/**
 * Paper order ticket. Market orders only, filled by the server at the live
 * price. Everything that decides whether the order is sensible (cost, cash,
 * the stop, the money at risk) is on screen before the button.
 */
type TicketProps = {
  onClose: () => void;
  symbol: string;
  price: number | null;
  currency: string;
  /** Instrument currency -> account currency. */
  fx: number | null;
  suggested: number | null;
  planStop: number | null;
  fractional: boolean;
};

export function OrderTicket({ open, ...props }: TicketProps & { open: boolean }) {
  // The form mounts fresh on every open, so it always starts from the current plan.
  return (
    <Dialog open={open} onClose={props.onClose} title={`Paper order: ${props.symbol}`}>
      <TicketForm {...props} />
    </Dialog>
  );
}

function TicketForm({ onClose, symbol, price, currency, fx, suggested, planStop, fractional }: TicketProps) {
  const { book, placeOrder } = usePortfolio();
  const toast = useToast();
  const router = useRouter();
  const base = book?.account.currency ?? currency;
  const held = Number(book?.positions.find((p) => p.symbol === symbol)?.quantity ?? 0);
  const cash = Number(book?.cash ?? 0);

  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(suggested && suggested > 0 ? String(suggested) : '');
  const [stop, setStop] = useState(planStop ? planStop.toFixed(2) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const q = Number(qty);
  const s = stop ? Number(stop) : null;
  const rate = fx ?? 0;
  const costBase = price && rate ? q * price * rate : null;
  const riskBase = side === 'buy' && price && s && rate && s < price ? q * (price - s) * rate : null;

  const qtyError =
    !qty ? null
    : !(q > 0) ? 'Enter a quantity above zero.'
    : !fractional && !Number.isInteger(q) ? 'Whole units only for this instrument.'
    : side === 'sell' && q > held ? `You hold ${formatNumber(held, fractional ? 4 : 0)}. Short selling isn't available yet.`
    : side === 'buy' && costBase !== null && costBase > cash ? `That needs ${formatMoney(costBase, base)}; you have ${formatMoney(cash, base)}.`
    : null;
  const stopError = side === 'buy' && s !== null && price !== null && !(s > 0 && s < price)
    ? 'A stop for a buy sits below the current price.' : null;
  const blocked = price === null ? 'No live price right now, so orders are paused.'
    : fx === null ? 'Waiting for the exchange rate to your account currency.' : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!qty || qtyError || stopError || blocked) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await placeOrder(symbol, side, q, side === 'buy' && s ? { stop_price: s } : undefined);
      onClose();
      toast.show({
        message: result.duplicate ? 'That order was already placed.'
          : `Paper ${side} filled: ${formatNumber(q, fractional ? 4 : 0)} ${symbol} at ${formatMoney(result.price, result.currency ?? currency)}`,
        action: { label: 'View portfolio', onClick: () => router.push('/portfolio') },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div role="radiogroup" aria-label="Side" className="grid grid-cols-2 border border-control">
          {(['buy', 'sell'] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={side === v} onClick={() => setSide(v)}
                    className={clsx('min-h-11 text-body-sm font-medium capitalize',
                      side === v ? (v === 'buy' ? 'bg-up text-ink-0' : 'bg-down text-ink-0') : 'text-fg-2 hover:text-fg')}>
              {v}
            </button>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-body-sm">
          <dt className="text-fg-2">Live price</dt>
          <dd className="text-right tabular">{price ? formatMoney(price, currency) : '–'}</dd>
          <dt className="text-fg-2">Cash available</dt>
          <dd className="text-right tabular">{formatMoney(cash, base)}</dd>
          <dt className="text-fg-2">You hold</dt>
          <dd className="text-right tabular">{formatNumber(held, fractional ? 4 : 0)}</dd>
        </dl>

        <Field id="qty" label="Quantity" error={qtyError}
               hint={suggested ? `Suggested ${formatNumber(suggested, fractional ? 4 : 0)}, sized to your risk per trade.` : undefined}>
          <input id="qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value.trim())}
                 aria-invalid={Boolean(qtyError)} aria-describedby={describedBy('qty', Boolean(qtyError))}
                 className={inputClass} autoComplete="off" />
        </Field>

        {side === 'buy' && (
          <Field id="stop" label={`Stop (${currency}, optional)`} error={stopError}
                 hint="Recorded with the order so your journal can check the plan. Not executed automatically yet.">
            <input id="stop" inputMode="decimal" value={stop} onChange={(e) => setStop(e.target.value.trim())}
                   aria-invalid={Boolean(stopError)} aria-describedby={describedBy('stop', Boolean(stopError))}
                   className={inputClass} autoComplete="off" />
          </Field>
        )}

        <dl className="grid grid-cols-2 gap-y-2 border-t border-line pt-3 text-body-sm">
          <dt className="text-fg-2">Order value</dt>
          <dd className="text-right font-medium tabular">{costBase !== null && q > 0 ? formatMoney(costBase, base) : '–'}</dd>
          {side === 'buy' && (
            <>
              <dt className="text-fg-2">At risk if stopped</dt>
              <dd className="text-right font-medium tabular text-down">{riskBase !== null && q > 0 ? `−${formatMoney(riskBase, base)}` : '–'}</dd>
            </>
          )}
        </dl>

        {(blocked || error) && <p role="alert" className="text-body-sm text-down">{blocked || error}</p>}

        <Button type="submit" variant={side === 'buy' ? 'paper' : 'danger'} loading={submitting}
                disabled={!qty || Boolean(qtyError || stopError || blocked)}>
          Place paper {side}
        </Button>
        <p className="text-caption text-fg-3">
          Filled at the live price when you confirm. Paper trading only, educational, not investment advice.{' '}
          <Link href="/portfolio" className="underline underline-offset-2 hover:text-fg-2">Your portfolio</Link>
        </p>
      </form>
  );
}
