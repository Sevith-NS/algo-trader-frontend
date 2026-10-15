'use client';

import { UserProfile, useClerk } from '@clerk/nextjs';
import clsx from 'clsx';
import { useState, type FormEvent } from 'react';
import { Brokers } from '@/components/settings/Brokers';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, describedBy, inputClass } from '@/components/ui/Field';
import { ErrorState, LoadingBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { usePortfolio } from '@/context/PortfolioContext';
import { API_BASE, apiDelete, apiPatch, errorMessage } from '@/lib/api';
import type { Market, Profile } from '@/types/api';

const MARKETS: { id: Market; label: string }[] = [
  { id: 'india', label: 'India' }, { id: 'us', label: 'United States' }, { id: 'europe', label: 'Europe' },
  { id: 'asia', label: 'Asia Pacific' }, { id: 'crypto', label: 'Crypto' }, { id: 'fx', label: 'Currencies' },
  { id: 'commodities', label: 'Commodities' }, { id: 'bonds', label: 'Bonds and rates' },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="glass flex flex-col gap-4 rounded-2xl p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="flex items-center gap-3 text-micro uppercase text-fg"><span aria-hidden="true" className="ring-dot text-fg" />{title}</h2>
        {intro && <p className="max-w-prose text-body-sm text-fg-2">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Preferences({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const toast = useToast();
  const [risk, setRisk] = useState(profile.risk_per_trade_pct);
  const [markets, setMarkets] = useState<Market[]>(profile.markets);
  const [saving, setSaving] = useState(false);
  const riskNum = Number(risk);
  const riskError = !(riskNum > 0 && riskNum <= 10) ? 'Use a number between 0.1 and 10.' : null;
  const dirty = Number(risk) !== Number(profile.risk_per_trade_pct) || markets.join() !== profile.markets.join();

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (riskError || !markets.length) return;
    setSaving(true);
    try {
      await apiPatch('/api/me', { risk_per_trade_pct: riskNum.toFixed(2), markets });
      onSaved();
      toast.show({ message: 'Preferences saved' });
    } catch (err) {
      toast.show({ message: errorMessage(err), tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="flex max-w-xl flex-col gap-5" noValidate>
      <dl className="flex justify-between border-b border-line pb-3 text-body-sm">
        <dt className="text-fg-2">Account currency</dt>
        <dd className="ticker">{profile.base_currency}</dd>
      </dl>
      <Field id="pref-risk" label="Risk per trade (%)" error={riskError} hint="Used to size every suggested position.">
        <input id="pref-risk" inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)}
               aria-invalid={Boolean(riskError)} aria-describedby={describedBy('pref-risk', Boolean(riskError))} className={inputClass} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-table text-fg-2">Markets you trade</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MARKETS.map((m) => {
            const on = markets.includes(m.id);
            return (
              <label key={m.id} className={clsx('flex min-h-11 cursor-pointer items-center gap-3 border px-3 text-body-sm',
                on ? 'border-fg bg-white/[0.06]' : 'border-white/15 hover:border-white/30')}>
                <input type="checkbox" checked={on} className="accent-fg"
                       onChange={() => setMarkets((all) => (on ? all.filter((x) => x !== m.id) : [...all, m.id]))} />
                {m.label}
              </label>
            );
          })}
        </div>
        {!markets.length && <p role="alert" className="text-caption text-down">Pick at least one market.</p>}
      </fieldset>
      <div><Button type="submit" loading={saving} disabled={!dirty || Boolean(riskError) || !markets.length}>Save preferences</Button></div>
    </form>
  );
}

function DataAndPrivacy() {
  const { signOut, user } = useClerk();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE}/api/me/export`);
      if (!res.ok) throw new Error('export failed');
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement('a'), { href: url, download: 'polaris-export.json' });
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.show({ message: 'The export didn’t download. Try again in a moment.', tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const remove = async (e: FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    setError('');
    try {
      await apiDelete('/api/me', { confirm_email: email });
      await signOut({ redirectUrl: '/' });
    } catch (err) {
      setError(errorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <p className="text-body-sm text-fg-2">Download everything Polaris stores about you: profile, paper account, every fill, watchlists, your decision journal, broker connections (never their access tokens), synced holdings and alerts.</p>
        <Button variant="secondary" onClick={exportData} loading={exporting}>Export my data</Button>
      </div>
      <div className="flex flex-col items-start gap-2 border-t border-line pt-6">
        <p className="text-body-sm text-fg-2">Delete your account and all of its data. This can&apos;t be undone.</p>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete my account</Button>
      </div>
      <Dialog open={open} onClose={() => { setOpen(false); setEmail(''); setError(''); }} title="Delete your account">
        <form onSubmit={remove} className="flex flex-col gap-4" noValidate>
          <p className="text-body-sm text-fg-2">
            This permanently deletes your sign-in, paper account, fills, watchlists and journal. Export first if you want a copy.
          </p>
          <Field id="confirm-email" label={`Type your email${user?.primaryEmailAddress ? ` (${user.primaryEmailAddress.emailAddress})` : ''} to confirm`} error={error || null}>
            <input id="confirm-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)}
                   aria-invalid={Boolean(error)} aria-describedby={error ? 'confirm-email-error' : undefined} className={inputClass} />
          </Field>
          <Button type="submit" variant="danger" loading={deleting}
                  disabled={!email.trim() || email.trim().toLowerCase() !== user?.primaryEmailAddress?.emailAddress.toLowerCase()}>
            Delete everything
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

export default function Settings() {
  const { profile, loading, error, refresh } = usePortfolio();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-silver text-h2 font-normal tracking-[-0.03em] md:text-[40px] md:leading-[44px]">Settings</h1>

      <Section id="security-h" title="Account and security"
               intro="Your email, password, two-step verification and the devices signed in to Polaris. Turn on two-step verification to protect your account.">
        <div className="max-w-full overflow-x-auto">
          <UserProfile routing="hash" appearance={{ elements: { rootBox: 'w-full', cardBox: 'w-full max-w-none border border-white/10' } }} />
        </div>
      </Section>

      <Section id="brokers-h" title="Brokers"
               intro="Read-only connections that bring your real holdings into Polaris. Real holdings are kept apart from paper ones.">
        <Brokers />
      </Section>

      <Section id="prefs-h" title="Trading preferences">
        {loading && !profile ? <LoadingBlock lines={4} label="Loading preferences" />
          : error ? <ErrorState error={error} onRetry={() => void refresh()} />
          : profile && <Preferences key={profile.risk_per_trade_pct + profile.markets.join()} profile={profile} onSaved={() => void refresh()} />}
      </Section>

      <Section id="data-h" title="Data and privacy">
        <DataAndPrivacy />
      </Section>
    </div>
  );
}
