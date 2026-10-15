import { Show, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LandingMotion } from '@/components/landing/LandingMotion';
import { PlanChart } from '@/components/landing/PlanChart';
import { LEVELS, formatInr } from '@/components/landing/planData';
import { Wordmark } from '@/components/shell/AppShell';
import { buttonClass } from '@/components/ui/Button';

/**
 * Landing page, brand register (docs/DESIGN.md §9.6). Server-rendered in its
 * finished state; LandingMotion only animates it, so no-JS and reduced-motion
 * visitors get the complete page. Every figure is sample data and says so.
 */

const gutter = 'px-4 md:px-8 xl:px-12';
const micro = 'text-micro uppercase';

const TAPE = [
  ['NIFTY 50', '24,812.35', 0.62], ['SENSEX', '81,377.90', 0.54], ['BANK NIFTY', '52,104.10', -0.21],
  ['S&P 500', '5,812.44', 0.31], ['NASDAQ', '18,402.77', 0.88], ['USD/INR', '84.07', -0.04],
  ['RELIANCE', '2,914.50', 1.33], ['NVDA', '138.21', 2.14], ['INFY', '1,886.00', -1.94], ['HDFCBANK', '1,712.60', 1.21],
] as const;

const DESK = [
  { seat: 'Technical', verdict: 'Long bias', body: 'Price reclaimed the 50-day average on 1.8× volume. RSI 58, not stretched.', src: 'Daily bars · 15m delayed' },
  { seat: 'Fundamentals', verdict: 'Neutral', body: 'P/E 24 against a 5-year median of 26. Margins flat for three quarters.', src: 'Quarterly filings' },
  { seat: 'News', verdict: 'Mildly positive', body: 'Two sources on capacity expansion. One single-source rumour ignored.', src: '14 articles · tone scored' },
  { seat: 'Risk committee', verdict: 'Size capped', body: 'Adding this takes energy to 31% of the book. Size cut to keep it under 25%.', src: 'Your rules · your portfolio' },
];

const RISK = [
  { label: 'One-day VaR, 95%', value: 18200, kind: 'inr', note: 'On a bad day, 1 in 20, you could lose about this much.' },
  { label: 'Max drawdown, 1 year', value: 8.4, kind: 'pct-down', note: 'The deepest peak-to-trough fall your holdings took.' },
  { label: 'Largest position', value: 31, kind: 'pct', note: 'Share of the book in one name. Your rule says 25%.' },
];

function Sign({ up }: { up: boolean }) {
  return <span aria-hidden="true" className="text-[0.75em]">{up ? '▲' : '▼'}</span>;
}

function Pct({ value, className = '' }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 tabular ${up ? 'text-up' : 'text-down'} ${className}`}>
      <Sign up={up} />{up ? '+' : '−'}{Math.abs(value).toFixed(2)}%
    </span>
  );
}

function SectionHead({ kicker, title, body, id }: { kicker: string; title: ReactNode; body?: string; id: string }) {
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <span data-reveal className={`pill w-fit ${micro}`}>{kicker}</span>
      <h2 id={id} data-split className="text-silver text-[clamp(2.25rem,5vw,4.5rem)] font-normal leading-[1] tracking-[-0.035em]">
        {title}
      </h2>
      {body && <p data-reveal className="max-w-xl text-body text-fg-2 md:text-h4 md:font-normal">{body}</p>}
    </div>
  );
}

/* ------------------------------------------------------- hero cards -- */

function AllocationCard() {
  return (
    <div data-hero-card className="glass-hero w-full rounded-2xl p-6">
      <p className="flex items-center gap-3"><span aria-hidden="true" className="ring-dot text-fg" /><span className={`${micro} text-fg`}>Allocation</span></p>
      <div className="mt-5 flex items-baseline gap-5 pl-[34px]">
        <p><span className="block text-h1 tabular">64%</span><span className="text-body-sm text-fg-2">India</span></p>
        <span aria-hidden="true" className="text-h1 text-fg-2">/</span>
        <p><span className="block text-h1 tabular">36%</span><span className="text-body-sm text-fg-2">US</span></p>
      </div>
      <p className="mt-6 pl-[34px]"><span className="pill text-fg">Rebalance needed</span></p>
      <p className="mt-2 pl-[34px] text-body-sm text-fg-2">US equities drifted 4.2% over target</p>
    </div>
  );
}

function NetWorthCard() {
  return (
    <div data-hero-card className="glass-hero w-full rounded-2xl p-6">
      <p className="flex items-center justify-between">
        <span className={`${micro} text-fg`}>Real net worth</span>
        <span className="text-caption text-fg-2">Zerodha · Upstox</span>
      </p>
      <p className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="text-[40px] font-medium leading-none tracking-[-0.03em] tabular">₹1,84,20,500</span>
        <Pct value={2.4} className="text-body-sm" />
      </p>
      <svg viewBox="0 0 400 120" className="dot-grid mt-5 h-28 w-full" aria-hidden="true">
        <path data-draw d="M0 104 C40 96 60 76 96 80 S150 98 186 86 236 46 276 54 330 74 360 58 392 30 400 28"
              fill="none" stroke="rgb(255 255 255 / 0.75)" strokeWidth="2" />
      </svg>
    </div>
  );
}

function PaperCard() {
  return (
    <div data-hero-card className="glass-hero glass-paper w-full rounded-2xl p-6">
      <p className="flex items-center justify-between">
        <span className="pill text-paper">Paper</span>
        <span className="text-caption text-fg-2">Swing book</span>
      </p>
      <p className="mt-4 text-body-sm text-fg-2">Today, simulated</p>
      <p className="mt-1 flex items-baseline gap-3"><span className="text-h3 tabular">+₹8,420.00</span><Pct value={0.84} className="text-body-sm" /></p>
    </div>
  );
}

/* ------------------------------------------------------------- page -- */

export default function Landing() {
  return (
    <LandingMotion>
      <div className="relative min-h-[100dvh] overflow-x-clip bg-ink-0">
        {/* Film grain over the whole page. Tune it in globals.css (.landing-grain). */}
        <div aria-hidden="true" className="landing-grain" />

        <header data-nav className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] ${gutter}`}>
          {/* No band, no border: a blur and a dark wash that fade into the page. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150%] bg-gradient-to-b from-ink-0/90 via-ink-0/55 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_45%,transparent)]" />
          <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-8 md:h-20">
            <Link href="/" data-logo aria-label="Polaris, back to top"><Wordmark /></Link>
            <nav aria-label="Sections" className="hidden items-center gap-8 text-body-sm text-fg-2 md:flex">
              <a href="#real-paper" data-anchor className="hover:text-fg">Portfolio</a>
              <a href="#plan" data-anchor className="hover:text-fg">Plans</a>
              <a href="#desk" data-anchor className="hover:text-fg">AI desk</a>
              <a href="#trust" data-anchor className="hover:text-fg">Security</a>
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Show when="signed-out">
                <SignInButton>
                  <button className={buttonClass('ghost', 'md', 'hidden sm:inline-flex')}>Sign in</button>
                </SignInButton>
                <Link href="/sign-up" className={buttonClass('primary', 'md')}>Request access</Link>
              </Show>
              <Show when="signed-in">
                <Link href="/home" className={buttonClass('primary', 'md')}>Open Polaris</Link>
              </Show>
            </div>
          </div>
        </header>

        <main>
          {/* ------------------------------------------------------ hero -- */}
          <section data-hero aria-labelledby="hero-h" className="relative isolate grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div className={`relative flex flex-col items-center justify-center gap-8 pb-16 pt-32 text-center ${gutter}`}>
              <span data-hero-in className={`pill ${micro} text-fg`}>India + US · Real + paper</span>
              <h1 id="hero-h" data-hero-title
                  className="text-silver max-w-[16ch] text-[clamp(3rem,6.2vw,6.25rem)] font-normal leading-[0.98] tracking-[-0.04em]">
                See everything you own. Test everything you don&apos;t.
              </h1>
              <p data-hero-in className="max-w-xl text-body text-fg-2 md:text-h4 md:font-normal">
                Polaris reads your Zerodha and Upstox holdings, tracks India and US markets, and gives you a paper desk for every idea before real money moves.
              </p>
              <div data-hero-in className="flex flex-wrap justify-center gap-4">
                <Show when="signed-out">
                  <Link href="/sign-up" className={buttonClass('primary', 'lg')}>Request access</Link>
                  <SignInButton><button className={buttonClass('secondary', 'lg')}>Sign in</button></SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/home" className={buttonClass('primary', 'lg')}>Open Polaris</Link>
                </Show>
              </div>
              <p data-hero-in className="mt-6 text-caption text-fg-3">
                Reads from Zerodha and Upstox · Markets NSE, BSE, NYSE, NASDAQ · Invite only
              </p>
            </div>

            <div className="relative flex flex-col justify-center gap-4 px-4 pb-16 pt-10 sm:px-10 lg:pt-28 xl:px-16">
              <div aria-hidden="true" className="bloom left-[40%] top-[40%] h-[min(1000px,100vw)] w-[min(1000px,80vw)] -translate-x-1/2 -translate-y-1/2" />
              <div data-light-cards className="relative mx-auto flex w-full max-w-[420px] flex-col gap-4">
                <AllocationCard />
                <NetWorthCard />
                <PaperCard />
                <p data-hero-card className="text-center">
                  <span className="pill bg-ink-0/85 text-fg">Sample data</span>
                </p>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ tape -- */}
          {/* The light carries on through the tape: a bridge between the hero and
              the next section, its core below the tape so the tape's text only
              meets its faint edge. */}
          <div aria-hidden="true" className="relative isolate">
            <div className="bloom left-[-10%] top-[calc(50%+460px)] h-[min(1500px,200vw)] w-[min(1700px,220vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.65]" />
            <div className="overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              <div data-tape className="flex w-max gap-10 whitespace-nowrap">
                {[...TAPE, ...TAPE].map(([name, value, pct], i) => (
                  <span key={i} className="flex items-center gap-3 text-body-sm">
                    <span className={`${micro} text-fg-2`}>{name}</span>
                    <span className="tabular text-fg">{value}</span>
                    <Pct value={pct} />
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* -------------------------------------- pinned 1: real/paper -- */}
          <section id="real-paper" data-pin-rp aria-labelledby="rp-h" className={`relative isolate py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:min-h-[80dvh] lg:grid-cols-2">
              <SectionHead id="rp-h" kicker="Two books, one view" title="Real and paper, never mixed."
                           body="Your broker holdings sync read-only and stay exactly as they are. Ideas live in paper books with their own totals, always marked in blue." />
              <div className="relative isolate">
                <div aria-hidden="true" className="bloom left-[188%] top-[38%] h-[min(1300px,180vw)] w-[min(1300px,180vw)] -translate-x-1/2 -translate-y-1/2" />
                <div className="relative flex flex-col gap-4">
                  <PortfolioFace mode="real" />
                  <PortfolioFace mode="paper" />
                </div>
              </div>
            </div>
          </section>

          {/* ------------------------------------------ pinned 2: plan -- */}
          <section id="plan" data-pin-plan aria-labelledby="plan-h" className={`relative isolate py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto flex max-w-[1400px] flex-col gap-12 lg:min-h-[90dvh] lg:justify-center">
              <SectionHead id="plan-h" kicker="From symbol to plan" title="The plan comes before the button."
                           body="Entry, stop, two targets and a size that risks exactly what you chose. Shown before any paper order, every time." />
              <div className="relative isolate grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div aria-hidden="true" className="bloom left-[62%] top-[55%] h-[min(1200px,170vw)] w-[min(1900px,200vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.85]" />
                <div className="glass rounded-2xl p-4 md:p-6">
                  <p className="mb-4 flex items-center justify-between">
                    <span className={`${micro} text-fg`}>RELIANCE.NS · Daily</span>
                    <span className="text-caption text-fg-3">Illustrative</span>
                  </p>
                  <PlanChart />
                </div>
                <div className="glass flex flex-col rounded-2xl p-6">
                  <p className="flex items-center justify-between"><span className={`${micro} text-fg`}>Plan</span><span className="pill text-paper">Paper</span></p>
                  <dl className="mt-4 flex flex-col">
                    {[...LEVELS].reverse().map((l) => (
                      <div key={l.key} data-ticket-row className="flex items-baseline justify-between border-t border-white/[0.07] py-3">
                        <dt className="text-body-sm text-fg-2">{l.label}</dt>
                        <dd className={`tabular ${l.key === 'stop' ? 'text-down' : 'text-fg'}`}>
                          <span data-count={l.price} data-kind="inr">{formatInr(l.price)}</span>
                          <span className="ml-2 text-caption text-fg-3">{l.note}</span>
                        </dd>
                      </div>
                    ))}
                    <div data-ticket-row className="flex items-baseline justify-between border-t border-white/[0.07] py-3">
                      <dt className="text-body-sm text-fg-2">Size</dt>
                      <dd className="tabular"><span data-count="34" data-kind="int">34</span> shares <span className="ml-2 text-caption text-fg-3">1% risk</span></dd>
                    </div>
                  </dl>
                  <p className="mt-auto pt-4 text-caption text-fg-3">Risk if stopped: ₹1,380.40, 1% of the book.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------- desk -- */}
          <section id="desk" aria-labelledby="desk-h" className={`relative isolate py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
              <SectionHead id="desk-h" kicker="AI desk" title="An AI desk that shows its work."
                           body="Four seats argue the trade with their sources on the table. When a model is down, the card says so instead of guessing." />
              <div className="relative isolate">
                <div aria-hidden="true" className="bloom left-1/2 top-1/2 h-[min(700px,150vw)] w-[min(1400px,170vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.6]" />
              <div data-stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {DESK.map((d, i) => (
                  <article key={d.seat} className={`glass flex flex-col gap-4 rounded-2xl p-6 ${i === 3 ? 'glass-warn' : ''}`}>
                    <p className="flex items-center gap-3"><span aria-hidden="true" className="ring-dot text-fg" /><span className={`${micro} text-fg`}>{d.seat}</span></p>
                    <p className="text-h4 font-medium">{d.verdict}</p>
                    <p className="text-body-sm text-fg-2">{d.body}</p>
                    <p className="mt-auto border-t border-white/[0.07] pt-3 text-caption text-fg-3">{d.src}</p>
                  </article>
                ))}
              </div>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------- risk -- */}
          <section aria-labelledby="risk-h" className={`relative isolate py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
              <SectionHead id="risk-h" kicker="Risk" title="Risk you can read." body="Each number comes with one plain sentence about what it means." />
              <div className="relative isolate">
                <div aria-hidden="true" className="bloom left-1/2 top-1/2 h-[min(600px,140vw)] w-[min(1200px,170vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.55]" />
              <dl data-stagger className="grid gap-4 md:grid-cols-3">
                {RISK.map((r) => (
                  <div key={r.label} className="glass flex flex-col gap-3 rounded-2xl p-6">
                    <dt className={`${micro} text-fg-3`}>{r.label}</dt>
                    <dd className="text-silver text-[clamp(2.5rem,4.5vw,4rem)] font-normal leading-none tracking-[-0.03em] tabular">
                      {r.kind === 'inr' ? '₹' : r.kind === 'pct-down' ? '−' : ''}
                      <span data-count={r.value} data-kind={r.kind === 'inr' ? 'int-in' : 'dec'}>
                        {r.kind === 'inr' ? r.value.toLocaleString('en-IN') : r.value.toFixed(r.kind === 'pct' ? 0 : 1)}
                      </span>
                      {r.kind === 'inr' ? '' : '%'}
                    </dd>
                    <dd className="text-body-sm text-fg-2">{r.note}</dd>
                  </div>
                ))}
              </dl>
              </div>
            </div>
          </section>

          {/* ---------------------------------------------------- trust -- */}
          <section id="trust" aria-labelledby="trust-h" className={`py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2">
              <SectionHead id="trust-h" kicker="Security" title="Built to be honest." />
              <ul data-stagger className="flex flex-col">
                {[
                  ['Read-only broker access', 'Polaris can see your holdings. It can never place an order on a real account.'],
                  ['Your login, protected', 'Sign-in by Clerk with two-step verification. Polaris never stores a password.'],
                  ['Paper is always labelled', 'Simulated money is marked in blue on every screen and never added to real totals.'],
                  ['Your data, your call', 'Export everything or delete your account from Settings at any time.'],
                ].map(([t, b]) => (
                  <li key={t} className="flex gap-4 border-t border-white/10 py-6">
                    <span aria-hidden="true" className="ring-dot mt-0.5 shrink-0 text-fg" />
                    <span><span className="block text-h4 font-medium">{t}</span><span className="mt-1 block text-body-sm text-fg-2">{b}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ---------------------------------------------------- close -- */}
          <section aria-labelledby="close-h" className="relative isolate">
            <div aria-hidden="true" className="bloom left-1/2 top-1/2 h-[min(1000px,180vw)] w-[min(1400px,190vw)] -translate-x-1/2 -translate-y-1/2" />
            <div className={`relative z-10 mx-auto flex max-w-[1400px] justify-center py-28 md:py-40 ${gutter}`}>
              <div data-reveal className="glass-hero flex w-full max-w-3xl flex-col items-center gap-8 rounded-[28px] px-6 py-16 text-center md:px-16">
                <span className={`pill ${micro} text-fg`}>Invite only</span>
                <h2 id="close-h" data-split className="text-silver max-w-[14ch] text-[clamp(2.5rem,6vw,5rem)] font-normal leading-[1] tracking-[-0.04em]">
                  Know what you own.
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  <Show when="signed-out">
                    <Link href="/sign-up" className={buttonClass('primary', 'lg')}>Request access</Link>
                  </Show>
                  <Show when="signed-in">
                    <Link href="/home" className={buttonClass('primary', 'lg')}>Open Polaris</Link>
                  </Show>
                </div>
              </div>
            </div>
          </section>
        </main>

        <div aria-hidden="true" className="mx-auto h-px max-w-[1400px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <footer className={`flex flex-wrap items-center justify-between gap-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] text-caption text-fg-3 ${gutter}`}>
          <span>Paper trading is simulated. Analytics are educational, not investment advice.</span>
          <span className="flex gap-6">
            <Link href="/legal/privacy" className="py-3 hover:text-fg">Privacy</Link>
            <Link href="/legal/terms" className="py-3 hover:text-fg">Terms</Link>
            <span className="py-3">© 2026 Polaris</span>
          </span>
        </footer>
      </div>
    </LandingMotion>
  );
}

/** One portfolio card in two states; the pinned scroll crossfades real into paper. */
function PortfolioFace({ mode }: { mode: 'real' | 'paper' }) {
  const paper = mode === 'paper';
  const rows = paper
    ? [['RELIANCE', '34', '₹99,093.00', 1.33], ['NVDA', '12', '$1,658.52', 2.14], ['INFY', '20', '₹37,720.00', -1.94]]
    : [['HDFCBANK', '120', '₹2,05,512.00', 1.21], ['ITC', '400', '₹1,90,840.00', 0.42], ['AAPL', '18', '$4,106.70', -0.36]];
  return (
    <div data-face={mode} aria-label={paper ? 'Paper book, simulated' : 'Real holdings, synced read-only'}
         className={`glass-hero rounded-2xl p-6 ${paper ? 'glass-paper' : ''}`}>
      {paper && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-paper" />}
      <p className="flex items-center justify-between">
        <span className={`pill ${paper ? 'text-paper' : 'text-fg'}`}>{paper ? 'Paper' : 'Real'}</span>
        <span className="text-caption text-fg-2">{paper ? 'Swing book · simulated' : 'Zerodha · synced 2m ago'}</span>
      </p>
      <p className="mt-5 text-body-sm text-fg-2">{paper ? 'Paper value' : 'Holdings value'}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-3">
        <span className="text-[44px] font-medium leading-none tracking-[-0.03em] tabular">{paper ? '₹2,74,330' : '₹1,84,20,500'}</span>
        <Pct value={paper ? 0.84 : 2.4} className="text-body-sm" />
      </p>
      <table className="mt-6 w-full text-body-sm">
        <thead><tr className="text-left text-caption text-fg-3"><th className="pb-2 font-normal">Symbol</th><th className="pb-2 text-right font-normal">Qty</th><th className="pb-2 text-right font-normal">Value</th><th className="pb-2 text-right font-normal">Today</th></tr></thead>
        <tbody>
          {rows.map(([s, q, v, c]) => (
            <tr key={s as string} className="border-t border-white/[0.07]">
              <td className="py-3 font-bold">{s}</td>
              <td className="py-3 text-right tabular text-fg-2">{q}</td>
              <td className="py-3 text-right tabular">{v}</td>
              <td className="py-3 text-right"><Pct value={c as number} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-caption text-fg-3">{paper ? 'Never added to your real net worth.' : 'Read-only. No order buttons on real accounts.'}</p>
    </div>
  );
}