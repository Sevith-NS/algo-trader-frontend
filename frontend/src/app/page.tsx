import { Show, SignInButton } from '@clerk/nextjs';
import { Instrument_Serif } from 'next/font/google';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { LandingMotion } from '@/components/landing/LandingMotion';
import { LandingNav } from '@/components/landing/LandingNav';
import { FxCard, MarketCard, getLandingMarkets, tapeItems, Change } from '@/components/landing/LiveMarkets';
import { PlanChart } from '@/components/landing/PlanChart';
import { LEVELS } from '@/components/landing/planData';
import { Wordmark } from '@/components/shell/AppShell';
import { buttonClass } from '@/components/ui/Button';

/**
 * Landing page, brand register (docs/DESIGN.md §9.6). Server-rendered in its
 * finished state; LandingMotion only animates it, so no-JS and reduced-motion
 * visitors get the complete page. No invented figures: market numbers are
 * live (LiveMarkets, sourced and timed), and the plan chart is marked illustrative.
 * Copy describes and explains; it never recommends a trade (SEBI IA/RA rules).
 */

const gutter = 'px-4 md:px-8 xl:px-12';
const micro = 'text-micro uppercase';

// The hero's one italic word. Self-hosted by next/font; landing only.
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: 'italic', variable: '--font-serif', display: 'swap' });

const factIcon = 'size-5 shrink-0 min-[1600px]:size-[22px]';
// Plain facts, no invented counts.
const HERO_FACTS = [
  {
    text: 'NSE, BSE, NYSE and NASDAQ',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={factIcon}>
        <defs>
          <linearGradient id="hf-a" x1="3" y1="2" x2="14" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity="0.38" /><stop offset="1" stopColor="#3a3a3a" stopOpacity="0.62" /></linearGradient>
          <linearGradient id="hf-b" x1="13" y1="2" x2="24" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#3a3a3a" stopOpacity="0.38" /><stop offset="1" stopColor="#fff" stopOpacity="0.62" /></linearGradient>
        </defs>
        <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#hf-a)" />
        <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#hf-b)" />
        <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
      </svg>
    ),
  },
  {
    text: 'Broker holdings sync read-only',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={factIcon}>
        <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#fff" />
        <path d="M12 7.1v7.4M8.15 12.35L12 16.2l3.85-3.85" fill="none" stroke="#111" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    text: 'Paper money never added to real',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className={factIcon}>
        <circle cx="9" cy="12" r="6.6" fill="none" stroke="#e8e8e8" strokeWidth="1.6" />
        <circle cx="15" cy="12" r="6.6" fill="none" stroke="var(--paper)" strokeWidth="1.6" strokeDasharray="2.4 2.2" />
      </svg>
    ),
  },
];

const TAPE = [
  'NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NIFTY MIDCAP 100', 'S&P 500', 'NASDAQ', 'DOW JONES', 'USD/INR',
  'NSE', 'BSE', 'NYSE', 'NASDAQ GS',
] as const;

const DESK = [
  { seat: 'Technical', focus: 'Trend and momentum', body: 'Where price sits against its moving averages and how volume compares, with the bars it read.', src: 'Daily bars · delay shown' },
  { seat: 'Fundamentals', focus: 'Valuation', body: 'Valuation against the company’s own history, and the margin trend from its filings.', src: 'Quarterly filings' },
  { seat: 'News', focus: 'Coverage', body: 'What sources report, with single-source claims flagged instead of counted.', src: 'Linked articles · tone scored' },
  { seat: 'Risk committee', focus: 'Your rules', body: 'Checks the idea against limits you set, like the most one name may take of your book.', src: 'Your rules · your portfolio' },
];

const RISK = [
  { label: 'One-day VaR, 95%', title: 'A bad day', note: 'About how much your holdings could lose on a bad day, one day in twenty.' },
  { label: 'Max drawdown', title: 'Deepest fall', note: 'The biggest peak-to-trough drop your holdings took over the period.' },
  { label: 'Concentration', title: 'Largest position', note: 'Share of the book in one name, checked against the limit you set.' },
];

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

/* ------------------------------------------------- compare and FAQ -- */

// Only claims checked against each company's own pages (Oct 2026). Facts, no adjectives.
const COMPARE: { row: string; cells: [string, string, string, string] }[] = [
  { row: 'What it is', cells: ['Read-only tracker and paper desk', 'Model portfolios you buy through your broker', 'Research and screener platform', 'Back office for a Zerodha account'] },
  { row: 'Who decides what to buy', cells: ['You. Polaris never recommends', 'SEBI-registered basket managers', 'You. Content is informational', 'You'] },
  { row: 'SEBI status', cells: ['Not registered; a software tool', 'Managers are registered RAs, RIAs or PMS', 'No RA or IA licence', 'Registered stockbroker'] },
  { row: 'Price', cells: ['Free during the beta', '₹100 or 1.5% per buy, plus any manager fee', 'Free tier; Pro from ₹399 a month', 'Included with the account'] },
];

const FAQ: [string, ReactNode][] = [
  ['Is this investment advice?', 'No. Polaris is a software tool. It is not registered with SEBI as an Investment Adviser or Research Analyst, and never tells you what to buy or sell. You pick the stock, the method and the risk; Polaris does the arithmetic and shows its working.'],
  ['Who sets the entry and stop?', 'You do, by choosing the method and your risk per trade. Every formula and every input is on screen, and plans only place paper orders.'],
  ['Where does the data come from, and how old is it?', 'Market data comes from Yahoo Finance and NSE public pages, and news from Google News. Quotes can be delayed. Every figure shows its source and time.'],
  ['What can Polaris do with my broker login?', 'Read your holdings and today’s positions. Nothing else: there is no order button on a real account. The access token is encrypted into a cookie in your own browser, sent only to read your holdings, and never stored on our servers. Disconnect any time and it is gone.'],
  ['How does Polaris make money?', 'It doesn’t yet; it’s free during the beta. We take no commissions from brokers, basket managers or referrals, and no stock is ever featured for pay.'],
  ['When do US brokers come?', 'US markets are live today. Syncing US broker holdings is planned; until then Polaris says so plainly instead of pretending.'],
  ['How do I delete my data?', 'Settings → Delete account removes everything Polaris stores, and Settings → Export gives you a copy first.'],
];

/* ------------------------------------------------------------- page -- */

export default async function Landing() {
  const markets = await getLandingMarkets();
  const tape = tapeItems(markets, TAPE);
  return (
    <LandingMotion>
      <div className={`relative min-h-[100dvh] overflow-x-clip bg-ink-0 ${serif.variable}`}>
        {/* Film grain over the whole page. Tune it in globals.css (.landing-grain). */}
        <div aria-hidden="true" className="landing-grain" />

        <header data-nav className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top,0px)] ${gutter}`}>
          {/* No band, no border: a blur and a dark wash that fade into the page. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[150%] bg-gradient-to-b from-ink-0/90 via-ink-0/55 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_45%,transparent)]" />
          <LandingNav
            logo={<Link href="/" data-logo aria-label="Polaris, back to top"><Wordmark /></Link>}
            cta={<>
              <Show when="signed-out">
                <Link href="/sign-up" className={buttonClass('primary', 'md', 'shine min-h-10 px-4')}>Request access</Link>
              </Show>
              <Show when="signed-in">
                <Link href="/home" className={buttonClass('primary', 'md', 'shine min-h-10 px-4')}>Open Polaris</Link>
              </Show>
            </>}
          />
        </header>

        <main>
          {/* ------------------------------------------------------ hero -- */}
          {/* One frame: the copy sits low and centred over the light field,
              three plain facts run along the bottom edge. */}
          <section data-hero aria-labelledby="hero-h" className="relative isolate flex min-h-[100dvh] flex-col">
            <div aria-hidden="true" className="bloom left-1/2 top-[14%] h-[min(900px,140vw)] w-[min(1500px,200vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.5]" />
            <div className="flex flex-1 items-end justify-center px-5 pb-12 pt-28 md:pb-16 lg:pb-[85px]">
              <div className="flex w-full max-w-[860px] flex-col items-center text-center min-[1600px]:max-w-[980px] min-[1920px]:max-w-[1120px]">
                <span className="appear appear--pop mb-5 inline-flex items-center gap-2 hero-badge px-4 py-2 text-[12.5px] tracking-[-0.01em] min-[1600px]:text-[13.5px]"
                      style={{ '--d': '0.22s' } as CSSProperties}>
                  <span aria-hidden="true" className="ring-dot !size-4 text-fg" />
                  India and US · real and paper, kept apart
                </span>
                <h1 id="hero-h" className="text-silver flex flex-col items-center text-[36px] font-medium leading-[1.12] tracking-[-0.045em] md:text-[42px] lg:text-[48px] xl:text-[54px] min-[1600px]:text-[64px] min-[1920px]:text-[76px]">
                  <span className="mask-line"><span className="appear appear--mask block" style={{ '--d': '0.42s' } as CSSProperties}>India and US markets.</span></span>
                  <span className="mask-line"><span className="appear appear--mask block" style={{ '--d': '0.62s' } as CSSProperties}>One <em className="hero-em">honest</em> view.</span></span>
                </h1>
                <p className="appear appear--soft mt-4 max-w-[470px] text-[16.5px] leading-[1.55] tracking-[-0.015em] text-fg-3 md:text-[15.5px] min-[1600px]:max-w-[540px] min-[1600px]:text-[18px]"
                   style={{ '--d': '0.82s', animationDuration: '1.25s' } as CSSProperties}>
                  Sync your Indian broker read-only, follow both markets live, and test every idea on paper with maths you can see.
                </p>
                <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <Show when="signed-out">
                    <Link href="/sign-up" className={buttonClass('primary', 'md', 'shine appear appear--btn px-5')} style={{ '--d': '0.96s' } as CSSProperties}>Request access</Link>
                    <SignInButton><button className={buttonClass('secondary', 'md', 'shine appear appear--side px-5')} style={{ '--d': '1.10s' } as CSSProperties}>Sign in</button></SignInButton>
                  </Show>
                  <Show when="signed-in">
                    <Link href="/home" className={buttonClass('primary', 'md', 'shine appear appear--btn px-5')} style={{ '--d': '0.96s' } as CSSProperties}>Open Polaris</Link>
                  </Show>
                </div>
              </div>
            </div>

            <ul aria-label="At a glance" className="flex flex-col items-center gap-4 px-5 pb-[max(28px,env(safe-area-inset-bottom))] text-[15px] tracking-[-0.015em] text-fg-2 md:flex-row md:justify-between md:gap-6 md:px-12 md:pb-9 md:text-[13.5px] xl:px-[72px] min-[1600px]:px-24 min-[1600px]:text-[15px]">
              {HERO_FACTS.map((f, i) => (
                <li key={f.text} className="appear appear--stat inline-flex items-center gap-3.5 md:whitespace-nowrap" style={{ '--d': `${1.12 + i * 0.16}s` } as CSSProperties}>
                  {f.icon}{f.text}
                </li>
              ))}
            </ul>
          </section>

          {/* --------------------------------------------- live markets -- */}
          <section aria-label="Live markets" className={`relative isolate py-16 md:py-24 ${gutter}`}>
            <div aria-hidden="true" className="bloom left-1/2 top-1/2 h-[min(900px,160vw)] w-[min(1500px,200vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.7]" />
            <div data-stagger className="mx-auto grid max-w-[1400px] gap-4 md:grid-cols-3">
              <MarketCard title="India" market={markets?.india ?? null} />
              <MarketCard title="United States" market={markets?.us ?? null} />
              <FxCard fx={markets?.fx ?? null} />
            </div>
            <p className="mt-6 text-center">
              <span className="pill bg-ink-0/85 text-fg">Live, delayed market data</span>
            </p>
          </section>

          {/* ------------------------------------------------------ tape -- */}
          {/* The light carries on through the tape: a bridge between the hero and
              the next section, its core below the tape so the tape's text only
              meets its faint edge. */}
          <div aria-hidden="true" className="relative isolate">
            <div className="bloom left-[-10%] top-[calc(50%+460px)] h-[min(1500px,200vw)] w-[min(1700px,220vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.65]" />
            <div className="overflow-hidden py-6 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
              <div data-tape className="flex w-max gap-10 whitespace-nowrap">
                {[...tape, ...tape].map((t, i) => (
                  <span key={i} className="flex items-center gap-3 text-body-sm">
                    <span className={`${micro} text-fg-2`}>{t.name}</span>
                    {t.value !== null && <span className="tabular text-fg">{t.value}</span>}
                    {t.value !== null && <Change pct={t.pct} />}
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
          <section id="plan" data-plan aria-labelledby="plan-h" className={`relative isolate py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto flex max-w-[1400px] flex-col gap-12 lg:min-h-[90dvh] lg:justify-center">
              <SectionHead id="plan-h" kicker="From symbol to plan" title="The plan comes before the button."
                           body="Entry, stop, two targets and a size that risks exactly what you chose. Shown before any paper order, every time." />
              <div className="relative isolate grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div aria-hidden="true" className="bloom left-[62%] top-[55%] h-[min(1200px,170vw)] w-[min(1900px,200vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.85]" />
                <div className="glass rounded-2xl p-4 md:p-6">
                  <p className="mb-4 flex items-center justify-between">
                    <span className={`${micro} text-fg`}>Example · Daily candles</span>
                    <span className="text-caption text-fg-3">Illustrative, not market data</span>
                  </p>
                  <PlanChart />
                </div>
                <div className="glass flex flex-col rounded-2xl p-6">
                  <p className="flex items-center justify-between"><span className={`${micro} text-fg`}>Plan</span><span className="pill text-paper">Paper</span></p>
                  <dl className="mt-4 flex flex-col">
                    {[...LEVELS].reverse().map((l) => (
                      <div key={l.key} data-ticket-row className="flex items-baseline justify-between border-t border-white/[0.07] py-3">
                        <dt className="text-body-sm text-fg-2">{l.label}</dt>
                        <dd className={`text-right ${l.key === 'stop' ? 'text-down' : 'text-fg'}`}>
                          {l.rule}<span className="ml-2 text-caption text-fg-3">{l.note}</span>
                        </dd>
                      </div>
                    ))}
                    <div data-ticket-row className="flex items-baseline justify-between border-t border-white/[0.07] py-3">
                      <dt className="text-body-sm text-fg-2">Size</dt>
                      <dd className="text-right">Risk ÷ (entry − stop)<span className="ml-2 text-caption text-fg-3">you pick the risk</span></dd>
                    </div>
                  </dl>
                  <p className="mt-auto pt-4 text-caption text-fg-3">Prices fill in from the live quote when you open a symbol. You set every rule.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------- desk -- */}
          <section id="desk" aria-labelledby="desk-h" className={`relative isolate py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
              <SectionHead id="desk-h" kicker="AI desk" title="An AI desk that shows its work."
                           body="Four seats explain what they see, with their sources on the table. They describe and never tell you to buy or sell. When a model is down, the card says so instead of guessing." />
              <div className="relative isolate">
                <div aria-hidden="true" className="bloom left-1/2 top-1/2 h-[min(700px,150vw)] w-[min(1400px,170vw)] -translate-x-1/2 -translate-y-1/2 [--b:0.6]" />
              <div data-stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {DESK.map((d, i) => (
                  <article key={d.seat} className={`glass flex flex-col gap-4 rounded-2xl p-6 ${i === 3 ? 'glass-warn' : ''}`}>
                    <p className="flex items-center gap-3"><span aria-hidden="true" className="ring-dot text-fg" /><span className={`${micro} text-fg`}>{d.seat}</span></p>
                    <p className="text-h4 font-medium">{d.focus}</p>
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
                    <dd className="text-silver text-[clamp(2rem,3.5vw,3rem)] font-normal leading-none tracking-[-0.03em]">{r.title}</dd>
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
                  ['Your broker token stays with you', 'It is encrypted into a cookie in your own browser and only used to read. Nothing about your broker account is stored on our servers.'],
                  ['No commissions, no featured stocks', 'We take nothing from brokers, basket managers or referrals, and never promote a stock for pay.'],
                  ['Your login, protected', 'Sign-in by Clerk with two-step verification. Polaris never stores a password.'],
                  ['Paper is always labelled', 'Simulated money is marked in blue on every screen and never added to real totals. Every paper trade stays on record, losers included.'],
                  ['Your data, your call', 'Export everything or delete your account from Settings at any time.'],
                  ['Every number shows its source', 'Each figure says where it came from and how old it is. NSE and US quotes can be delayed.'],
                  ['Information, not advice', 'Polaris is not registered with SEBI as an Investment Adviser or Research Analyst, or with the SEC or FINRA. Nothing here is a recommendation to buy or sell.'],
                ].map(([t, b]) => (
                  <li key={t} className="flex gap-4 border-t border-white/10 py-6">
                    <span aria-hidden="true" className="ring-dot mt-0.5 shrink-0 text-fg" />
                    <span><span className="block text-h4 font-medium">{t}</span><span className="mt-1 block text-body-sm text-fg-2">{b}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* -------------------------------------------------- compare -- */}
          <section id="compare" aria-labelledby="compare-h" className={`py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto flex max-w-[1400px] flex-col gap-12">
              <SectionHead id="compare-h" kicker="Compared" title="Where Polaris fits."
                           body="Polaris doesn't replace a broker or a basket. It shows what you own across markets and lets you test ideas first." />
              <div data-reveal className="glass overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[760px] text-left text-body-sm">
                  <caption className="sr-only">Polaris compared with smallcase, Tickertape and Zerodha Console</caption>
                  <thead>
                    <tr className="text-caption text-fg-3">
                      <th scope="col" className="p-4 font-normal"><span className="sr-only">Feature</span></th>
                      {['Polaris', 'smallcase', 'Tickertape', 'Zerodha Console'].map((h, i) => (
                        <th key={h} scope="col" className={`p-4 font-normal ${micro} ${i === 0 ? 'text-fg' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE.map(({ row, cells }) => (
                      <tr key={row} className="border-t border-white/[0.07] align-top">
                        <th scope="row" className="p-4 font-normal text-fg-2">{row}</th>
                        {cells.map((c, i) => <td key={i} className={`p-4 ${i === 0 ? 'text-fg' : 'text-fg-2'}`}>{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-white/[0.07] p-4 text-caption text-fg-3">
                  From each company&apos;s public pages, October 2026. Something changed? Tell us and we&apos;ll correct it.
                </p>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ faq -- */}
          <section id="faq" aria-labelledby="faq-h" className={`py-24 md:py-32 ${gutter}`}>
            <div className="mx-auto grid max-w-[1400px] gap-12 lg:grid-cols-2">
              <SectionHead id="faq-h" kicker="FAQ" title="Straight answers." />
              <div data-stagger className="flex flex-col">
                {FAQ.map(([q, a]) => (
                  <details key={q} className="group border-t border-white/10 py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-h4 font-medium">
                      {q}
                      <span aria-hidden="true" className="text-fg-3 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 max-w-xl text-body-sm text-fg-2">{a}</p>
                  </details>
                ))}
              </div>
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
          <span className="max-w-3xl">
            Paper trading is simulated. Analytics are for information only, not investment advice or a
            recommendation. Polaris is not a SEBI-registered Investment Adviser or Research Analyst, nor a US broker-dealer
            or investment adviser. Quotes can be delayed. Investments in securities are subject to market risks.
          </span>
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
    ? [['Orders', 'Filled at the live quote, simulated'], ['Cash and P&L', 'The book’s own, from its fills'], ['Plans', 'Entry, stop and size before every order']]
    : [['Holdings', 'Live from your broker on every view'], ['Currency', 'INR and USD side by side'], ['Orders', 'None. Real accounts are read-only']];
  return (
    <div data-face={mode} aria-label={paper ? 'Paper book, simulated' : 'Real holdings, synced read-only'}
         className={`glass-hero rounded-2xl p-6 ${paper ? 'glass-paper' : ''}`}>
      {paper && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-paper" />}
      <p className="flex items-center justify-between">
        <span className={`pill ${paper ? 'text-paper' : 'text-fg'}`}>{paper ? 'Paper' : 'Real'}</span>
        <span className="text-caption text-fg-2">{paper ? 'Swing book · simulated' : 'Zerodha · read-only'}</span>
      </p>
      <p className="mt-5 text-[clamp(1.75rem,3vw,2.5rem)] font-medium leading-none tracking-[-0.03em]">
        {paper ? 'Your paper book' : 'Your broker holdings'}
      </p>
      <dl className="mt-6 text-body-sm">
        {rows.map(([t, d]) => (
          <div key={t} className="flex justify-between gap-4 border-t border-white/[0.07] py-3">
            <dt className="font-bold">{t}</dt>
            <dd className="text-right text-fg-2">{d}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-caption text-fg-3">{paper ? 'Never added to your real net worth.' : 'Read-only. No order buttons on real accounts.'}</p>
    </div>
  );
}