import { Show, SignInButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { Wordmark } from '@/components/shell/AppShell';
import { ButtonLink, buttonClass } from '@/components/ui/Button';
import productShot from '../../public/landing/symbol-aapl.png';

const STEPS = [
  { title: 'Plan', body: 'Search any stock, ETF, coin or currency pair. Flint gives you an entry, a stop and two targets, with the odds behind each one.' },
  { title: 'Size', body: 'Set how much you will risk on one trade. Every suggested position is sized so a stopped-out trade costs exactly that.' },
  { title: 'Check', body: 'An AI desk of analysts argues the trade, a risk committee caps it, and you see every argument before you decide.' },
  { title: 'Review', body: 'Every paper fill and every desk decision is kept and scored against the market, so you learn what actually works.' },
];

/** A real plan panel with illustrative numbers, labelled as such. */
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
    <figure className="w-full border border-line bg-ink-1 lg:max-w-sm">
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

      <main className="flex flex-1 flex-col gap-24 pb-24 pt-12 md:gap-32 md:pt-20">
        {/* Hero: one message, one action, one real panel. */}
        <section className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
          <div className="flex flex-col gap-6">
            <h1 className="max-w-3xl font-display text-h2 font-bold tracking-[-0.02em] md:text-h1 xl:text-display">
              Every trade, a plan you can defend.
            </h1>
            <p className="max-w-xl text-body text-fg-2">
              Flint turns any stock, ETF, coin or currency into an entry, stop, size and risk. Practise with paper money first.
            </p>
            <div>
              <Show when="signed-out"><ButtonLink href="/sign-up">I have an invite</ButtonLink></Show>
              <Show when="signed-in"><ButtonLink href="/home">Open Flint</ButtonLink></Show>
            </div>
          </div>
          <ExamplePlan />
        </section>

        {/* The product itself, captured from the app: no mock-up. */}
        <section aria-labelledby="see-h" className="flex flex-col gap-6">
          <h2 id="see-h" className="text-h3 font-bold">Every price says where it came from</h2>
          <figure className="flex flex-col gap-3">
            <div className="overflow-hidden border border-line">
              <Image src={productShot} placeholder="empty" sizes="(min-width: 1440px) 1376px, 100vw"
                     alt="Flint's page for Apple: the price with its source and 15-minute delay, and the plan's entry, stop and two targets drawn on the daily chart."
                     className="h-auto w-full" />
            </div>
            <figcaption className="max-w-prose text-body-sm text-fg-2">
              Apple on Flint. The quote is labelled with its source and delay, and the plan&apos;s levels sit on the chart before you trade.
            </figcaption>
          </figure>
        </section>

        <section aria-labelledby="how-h" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <h2 id="how-h" className="text-h3 font-bold">How Flint works</h2>
          <ol className="flex flex-col divide-y divide-line border-y border-line">
            {STEPS.map((s) => (
              <li key={s.title} className="grid gap-2 py-6 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-8">
                <h3 className="text-h4 font-bold">{s.title}</h3>
                <p className="max-w-prose text-body text-fg-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-h4 font-bold">Built to be honest about risk</h2>
          <p className="text-body text-fg-2">
            Models scored on their own training data say so. Nothing celebrates a trade. Export or delete your data any time.
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
