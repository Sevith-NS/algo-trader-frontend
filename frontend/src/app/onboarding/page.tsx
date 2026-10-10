'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Wordmark } from '@/components/shell/AppShell';
import { Button } from '@/components/ui/Button';
import { Field, describedBy, inputClass } from '@/components/ui/Field';
import { apiPost, errorMessage } from '@/lib/api';
import { useBrowserValue } from '@/lib/browser';
import { formatMoney } from '@/lib/format';
import type { Market } from '@/types/api';

const CURRENCIES = [
  { code: 'INR', name: 'Indian rupee', cash: 1_000_000 },
  { code: 'USD', name: 'US dollar', cash: 100_000 },
  { code: 'EUR', name: 'Euro', cash: 92_000 },
  { code: 'GBP', name: 'British pound', cash: 78_000 },
  { code: 'SGD', name: 'Singapore dollar', cash: 130_000 },
  { code: 'AED', name: 'UAE dirham', cash: 367_000 },
  { code: 'JPY', name: 'Japanese yen', cash: 15_000_000 },
  { code: 'AUD', name: 'Australian dollar', cash: 150_000 },
  { code: 'CAD', name: 'Canadian dollar', cash: 137_000 },
  { code: 'CHF', name: 'Swiss franc', cash: 88_000 },
  { code: 'HKD', name: 'Hong Kong dollar', cash: 780_000 },
] as const;

const MARKETS: { id: Market; label: string; hint: string }[] = [
  { id: 'india', label: 'India', hint: 'NSE and BSE' },
  { id: 'us', label: 'United States', hint: 'NYSE and Nasdaq' },
  { id: 'europe', label: 'Europe', hint: 'LSE, Xetra, Euronext' },
  { id: 'asia', label: 'Asia Pacific', hint: 'Tokyo, Hong Kong, Singapore' },
  { id: 'crypto', label: 'Crypto', hint: 'Bitcoin, Ether and majors' },
  { id: 'fx', label: 'Currencies', hint: 'Major FX pairs' },
  { id: 'commodities', label: 'Commodities', hint: 'Gold, oil, metals' },
  { id: 'bonds', label: 'Bonds and rates', hint: 'Government yields' },
];

function guessCurrency(): string {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    const byRegion: Record<string, string> = {
      IN: 'INR', US: 'USD', GB: 'GBP', SG: 'SGD', AE: 'AED', JP: 'JPY', AU: 'AUD', CA: 'CAD', CH: 'CHF', HK: 'HKD',
      DE: 'EUR', FR: 'EUR', NL: 'EUR', ES: 'EUR', IT: 'EUR', IE: 'EUR',
    };
    return (region && byRegion[region]) || 'USD';
  } catch {
    return 'USD';
  }
}

const STEPS = ['Currency', 'Markets', 'Risk'] as const;

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  // Defaults come from the browser's locale; a choice the person makes wins.
  const guessed = useBrowserValue(guessCurrency, 'USD');
  const [currencyChoice, setCurrency] = useState<string | null>(null);
  const currency = currencyChoice ?? guessed;
  const [marketsChoice, setMarkets] = useState<Market[] | null>(null);
  const markets: Market[] = marketsChoice ?? (currency === 'INR' ? ['india', 'us'] : ['us']);
  const [risk, setRisk] = useState('1');
  const [cashInput, setCash] = useState<string | null>(null);
  const cash = cashInput ?? String(CURRENCIES.find((c) => c.code === currency)?.cash ?? 100_000);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to each new step's question so keyboard and screen-reader
  // users land where the content changed.
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const riskNum = Number(risk);
  const cashNum = Number(cash);
  const riskError = !(riskNum > 0 && riskNum <= 10) ? 'Use a number between 0.1 and 10.' : null;
  const cashError = !(cashNum > 0 && cashNum <= 1e11) ? 'Enter an amount above zero.' : null;

  const next = () => {
    setError('');
    if (step === 1 && markets.length === 0) {
      setError('Pick at least one market.');
      return;
    }
    setStep((s) => s + 1);
  };

  const finish = async () => {
    if (riskError || cashError) return;
    setSaving(true);
    setError('');
    try {
      await apiPost('/api/me/onboarding', {
        base_currency: currency, markets, risk_per_trade_pct: riskNum.toFixed(2), starting_cash: cashNum.toFixed(2),
      });
      router.replace('/home');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 pb-10 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
      <header className="flex h-12 items-center justify-between">
        <Wordmark />
        <span className="text-caption text-fg-3">Step {step + 1} of {STEPS.length}</span>
      </header>

      <ol aria-label="Progress" className="mt-2 grid grid-cols-3 gap-1">
        {STEPS.map((s, i) => (
          <li key={s} aria-current={i === step ? 'step' : undefined}
              className={clsx('h-0.5', i <= step ? 'bg-up' : 'bg-line-strong')}>
            <span className="sr-only">{s}{i < step ? ', done' : ''}</span>
          </li>
        ))}
      </ol>

      <main className="flex flex-1 flex-col gap-6 pt-10">
        {step === 0 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="contents">
              <h1 ref={headingRef} tabIndex={-1} className="text-h3 font-bold outline-none">Which currency should Flint count in?</h1>
            </legend>
            <p className="text-body-sm text-fg-2">Your paper balance, profit and risk are shown in this currency. Holdings in other currencies are converted at live rates.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CURRENCIES.map((c) => (
                <label key={c.code} className={clsx('flex min-h-12 cursor-pointer items-center gap-3 border px-3',
                  currency === c.code ? 'border-up bg-up/[0.06]' : 'border-line hover:border-control')}>
                  <input type="radio" name="currency" value={c.code} checked={currency === c.code}
                         onChange={() => setCurrency(c.code)} className="accent-[#2FBF71]" />
                  <span className="ticker text-body-sm">{c.code}</span>
                  <span className="text-body-sm text-fg-2">{c.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset className="flex flex-col gap-4">
            <legend className="contents">
              <h1 ref={headingRef} tabIndex={-1} className="text-h3 font-bold outline-none">Which markets do you trade?</h1>
            </legend>
            <p className="text-body-sm text-fg-2">These shape your default lists and market views. You can trade anything either way, and change this later in Settings.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MARKETS.map((m) => {
                const on = markets.includes(m.id);
                return (
                  <label key={m.id} className={clsx('flex min-h-14 cursor-pointer items-center gap-3 border px-3 py-2',
                    on ? 'border-up bg-up/[0.06]' : 'border-line hover:border-control')}>
                    <input type="checkbox" checked={on} className="accent-[#2FBF71]"
                           onChange={() => setMarkets(on ? markets.filter((x) => x !== m.id) : [...markets, m.id])} />
                    <span className="flex flex-col">
                      <span className="text-body-sm font-medium">{m.label}</span>
                      <span className="text-caption text-fg-3">{m.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h1 ref={headingRef} tabIndex={-1} className="text-h3 font-bold outline-none">How much will you risk on one trade?</h1>
            <p className="text-body-sm text-fg-2">Flint sizes every suggested position so that if the stop is hit, you lose this share of your balance. Most disciplined traders use 0.5% to 2%.</p>
            <Field id="risk" label="Risk per trade (%)" error={riskError}
                   hint={Number.isFinite(riskNum * cashNum) && !riskError && !cashError
                     ? `That is ${formatMoney((riskNum / 100) * cashNum, currency, 0)} at risk per trade.` : undefined}>
              <input id="risk" inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)}
                     aria-invalid={Boolean(riskError)} aria-describedby={describedBy('risk', Boolean(riskError))}
                     className={inputClass} />
            </Field>
            <Field id="cash" label={`Starting paper balance (${currency})`} error={cashError}
                   hint="Paper money only. You can't add funds later, so pick an amount close to what you'd really trade.">
              <input id="cash" inputMode="decimal" value={cash}
                     onChange={(e) => setCash(e.target.value.replace(/[,\s]/g, ''))}
                     aria-invalid={Boolean(cashError)} aria-describedby={describedBy('cash', Boolean(cashError))}
                     className={inputClass} />
            </Field>
          </div>
        )}

        {error && <p role="alert" className="text-body-sm text-down">{error}</p>}

        <div className="mt-auto flex gap-3 pt-6">
          {step > 0 && <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={saving}>Back</Button>}
          {step < STEPS.length - 1
            ? <Button onClick={next} className="flex-1 sm:flex-none">Continue</Button>
            : <Button onClick={finish} loading={saving} disabled={Boolean(riskError || cashError)} className="flex-1 sm:flex-none">
                Start paper trading
              </Button>}
        </div>
      </main>
    </div>
  );
}
