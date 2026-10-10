import { Show, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import { Wordmark } from '@/components/shell/AppShell';
import { ButtonLink, buttonClass } from '@/components/ui/Button';

const STEPS = [
  { title: 'Plan', body: 'Search any stock, ETF, coin or currency pair. Flint gives you an entry, a stop and two targets, with the odds behind each one.' },
  { title: 'Size', body: 'Set how much you will risk on one trade. Every suggested position is sized so a stopped-out trade costs exactly that.' },
  { title: 'Check', body: 'An AI desk of analysts argues the trade, a risk committee caps it, and you see every argument before you decide.' },
  { title: 'Review', body: 'Every paper fill and every desk decision is kept and scored against the market, so you learn what actually works.' },
];

function ExamplePlan() {
  const rows: [string, string, string?][] = [
    ['Signal', '▲ Long', '4 of 5 factors'],
    ['Entry', '₹2,902.00', 'limit'],
    ['Stop', '₹2,861.40', '1.5× ATR'],
    ['Target 1', '₹2,963.00', '1.5R'],
    ['Target 2', '₹3,023.80', '3R'],
    ['Size', '34 shares', '1% risk'],
    ['At risk if stopped', '−₹1,380.40'],
  ];
  return (
    <figure className="w-full max-w-sm border border-line bg-ink-1">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <span className="ticker">RELIANCE.NS</span>
        <span className="text-caption text-fg-3">Example plan</span>
      </div>
      <dl className="px-4">
        {rows.map(([k, v, hint]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
            <dt className="text-body-sm text-fg-2">{k}</dt>
            <dd className={`text-body-sm tabular ${k === 'Signal' ? 'text-up' : k.startsWith('At risk') ? 'text-down' : ''}`}>
              {v}{hint && <span className="ml-1.5 text-caption text-fg-3">{hint}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <figcaption className="border-t border-line px-4 py-2 text-caption text-fg-3">Illustrative numbers. Paper trading only.</figcaption>
    </figure>
  );
}

export default function Landing() {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-[1440px] flex-col px-4 md:px-8">
      <header className="flex h-14 items-center justify-between pt-[env(safe-area-inset-top,0px)]">
        <Wordmark />
        <Show when="signed-out">
          <SignInButton><button className={buttonClass('secondary', 'sm')}>Sign in</button></SignInButton>
        </Show>
        <Show when="signed-in">
          <ButtonLink href="/home" variant="secondary" size="sm">Open Flint</ButtonLink>
        </Show>
      </header>

      <main className="flex flex-1 flex-col gap-24 py-16 md:py-24">
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-6">
            <h1 className="max-w-3xl font-display text-h2 font-bold tracking-[-0.02em] md:text-h1 lg:text-display">
              Every trade, a plan you can defend.
            </h1>
            <p className="max-w-xl text-body text-fg-2">
              Flint turns any symbol into entry, stop, size and risk, for stocks, ETFs, crypto and currencies across global markets. Practise with paper money until the process is second nature.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Show when="signed-out">
                <ButtonLink href="/sign-up">I have an invite</ButtonLink>
                <span className="text-body-sm text-fg-3">Invite-only while in preview.</span>
              </Show>
              <Show when="signed-in">
                <ButtonLink href="/home">Open Flint</ButtonLink>
              </Show>
            </div>
          </div>
          <ExamplePlan />
        </section>

        <section aria-labelledby="how-h" className="flex flex-col gap-8">
          <h2 id="how-h" className="text-h3 font-bold">How Flint works</h2>
          <ol className="grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-2 bg-ink-0 p-5">
                <span className="text-caption text-fg-3 tabular">Step {i + 1}</span>
                <h3 className="text-h4 font-bold">{s.title}</h3>
                <p className="text-body-sm text-fg-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3 border-t border-line pt-8">
          <h2 className="text-h4 font-bold">Built to be honest about risk</h2>
          <p className="max-w-2xl text-body-sm text-fg-2">
            Every price shows where it came from and how old it is. Models that are scored on their own training data say so. Nothing celebrates a trade. You can export or delete your data at any time.
          </p>
        </section>
      </main>

      <footer className="flex flex-wrap justify-between gap-2 border-t border-line py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] text-caption text-fg-3">
        <span>Paper trading. Educational, not investment advice.</span>
        <span className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-fg-2">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-fg-2">Terms</Link>
        </span>
      </footer>
    </div>
  );
}
