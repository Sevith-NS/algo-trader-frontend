'use client';

import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, describedBy, inputClass } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { apiPatch, apiPost, errorMessage } from '@/lib/api';
import type { Alert, AlertKind } from '@/types/api';

export const CHECK_NOTE = 'Checked about once a minute while Polaris is open, on delayed data. An alert fires once, then waits for you to turn it back on.';

export const KIND_COPY: Record<AlertKind, { label: string; option: string; hint: string }> = {
  price_above: { label: 'Price rises to', option: 'Price rises to a level', hint: 'Fires when the price is at or above this level.' },
  price_below: { label: 'Price falls to', option: 'Price falls to a level', hint: 'Fires when the price is at or below this level.' },
  move_pct: { label: 'Day’s move reaches', option: 'Day’s move, up or down, reaches a percentage',
              hint: 'Fires when the day’s change, up or down, is at least this many percent.' },
};

// Same rule as the API (flint_api/validators.py), so mistakes show before sending.
const SYMBOL = /^[A-Za-z0-9^][A-Za-z0-9.\-=&^]{0,23}$/;

/** One sentence for an alert's condition, e.g. "RELIANCE.NS price rises to 3,000". */
export function describeAlert(a: Pick<Alert, 'symbol' | 'kind' | 'threshold'>): string {
  const n = Number(a.threshold).toLocaleString('en-IN', { maximumFractionDigits: 8 });
  return a.kind === 'move_pct' ? `${a.symbol} moves ${n}% or more in a day` : `${a.symbol} ${KIND_COPY[a.kind].label.toLowerCase()} ${n}`;
}

function Form({ alert, initialSymbol, onDone }: {
  alert?: Alert; initialSymbol?: string; onDone: (saved: Alert) => void;
}) {
  const editing = Boolean(alert);
  const [symbol, setSymbol] = useState(alert?.symbol ?? initialSymbol ?? '');
  const [kind, setKind] = useState<AlertKind>(alert?.kind ?? 'price_above');
  const [threshold, setThreshold] = useState(alert ? String(Number(alert.threshold)) : '');
  const [note, setNote] = useState(alert?.note ?? '');
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const value = Number(threshold);
  const symbolError = !editing && !SYMBOL.test(symbol.trim()) ? 'Enter a symbol, e.g. RELIANCE.NS or AAPL.' : null;
  const thresholdError = !(threshold.trim() && Number.isFinite(value) && value > 0)
    ? (kind === 'move_pct' ? 'Enter a percentage above 0.' : 'Enter a price above 0.')
    : kind === 'move_pct' && value > 100 ? 'Use a percentage up to 100.' : null;
  const noteError = note.length > 200 ? 'Keep the note under 200 characters.' : null;
  const invalid = Boolean(symbolError || thresholdError || noteError);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    setSaving(true);
    setServerError('');
    try {
      const saved = editing && alert
        ? await apiPatch<Alert>(`/api/alerts/${alert.id}`, { threshold: threshold.trim(), note: note.trim() })
        : await apiPost<Alert>('/api/alerts', { symbol: symbol.trim().toUpperCase(), kind, threshold: threshold.trim(),
                                                ...(note.trim() ? { note: note.trim() } : {}) });
      onDone(saved);
    } catch (err) {
      setServerError(errorMessage(err));
      setSaving(false);
    }
  };

  const show = (error: string | null) => (touched ? error : null);

  return (
    <form id="alert-form" onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {editing && alert ? (
        <p className="text-body-sm text-fg-2">
          <span className="ticker text-fg">{alert.symbol}</span> · {KIND_COPY[alert.kind].label.toLowerCase()} a level.
          The symbol and type can&apos;t change; delete this alert and create a new one for that.
        </p>
      ) : (
        <>
          <Field id="alert-symbol" label="Symbol" hint="As on the symbol page, e.g. RELIANCE.NS, TCS.NS, AAPL." error={show(symbolError)}>
            <input id="alert-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} autoComplete="off"
                   autoCapitalize="characters" spellCheck={false} className={clsx(inputClass, 'uppercase')}
                   aria-invalid={Boolean(show(symbolError))} aria-describedby={describedBy('alert-symbol', Boolean(show(symbolError)))} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-table text-fg-2">Alert me when</legend>
            {(Object.keys(KIND_COPY) as AlertKind[]).map((k) => (
              <label key={k} className={clsx('flex min-h-11 cursor-pointer items-center gap-3 border px-3 text-body-sm',
                kind === k ? 'border-fg bg-white/[0.06]' : 'border-white/15 hover:border-white/30')}>
                <input type="radio" name="alert-kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="accent-fg" />
                {KIND_COPY[k].option}
              </label>
            ))}
          </fieldset>
        </>
      )}
      <Field id="alert-threshold" label={kind === 'move_pct' ? 'Move (%)' : 'Price'} hint={KIND_COPY[kind].hint}
             error={show(thresholdError)}>
        <input id="alert-threshold" inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)}
               className={inputClass} aria-invalid={Boolean(show(thresholdError))}
               aria-describedby={describedBy('alert-threshold', Boolean(show(thresholdError)))} />
      </Field>
      <Field id="alert-note" label="Note (optional)" hint="Why this level matters, for future you." error={show(noteError)}>
        <input id="alert-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={220} className={inputClass}
               aria-invalid={Boolean(show(noteError))} aria-describedby={describedBy('alert-note', Boolean(show(noteError)))} />
      </Field>
      <p className="text-caption text-fg-3">{CHECK_NOTE}</p>
      {serverError && <p role="alert" className="text-body-sm text-down">{serverError}</p>}
      <Button type="submit" loading={saving} className="w-full">{editing ? 'Save changes' : 'Create alert'}</Button>
    </form>
  );
}

/** Create or edit an alert in a Sheet (right panel on laptop, bottom sheet on phone). */
export function AlertSheet({ open, onClose, alert, initialSymbol, onSaved }: {
  open: boolean; onClose: () => void; alert?: Alert; initialSymbol?: string; onSaved: (saved: Alert) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={alert ? 'Edit alert' : 'New alert'}
           description={alert ? undefined : 'Get told when a price crosses a level or moves sharply.'}>
      {/* Sheet unmounts its body once closed, so each opening starts from a clean form. */}
      <Form key={alert?.id ?? 'new'} alert={alert} initialSymbol={initialSymbol}
            onDone={(saved) => { onSaved(saved); onClose(); }} />

    </Sheet>
  );
}
