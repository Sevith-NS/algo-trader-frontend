import { notFound } from 'next/navigation';
import { Change } from '@/components/ui/Change';
import { SheetDemo } from './SheetDemo';

/**
 * Development-only gallery of the v3.1 design tokens and primitives
 * (docs/DESIGN.md). Each primitive is added here as it is rebuilt, so every
 * state can be checked in one place. 404 in production.
 */
export default function UiGallery() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="ambient min-h-[100dvh]">
      <main className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-12 md:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <span className="text-micro uppercase text-fg-3">Polaris design system v3.1</span>
          <h1 className="text-silver text-display">Glass</h1>
          <p className="max-w-prose text-body text-fg-2">
            Tokens, surfaces and primitives. Check every state at 360, 768, 1024 and 1440, with keyboard only and with reduced motion.
          </p>
        </header>

        <Section title="Surfaces">
          <div className="grid gap-4 md:grid-cols-3">
            <Surface className="glass" name="glass" note="Cards, panels, shell" />
            <Surface className="glass-2 relative" name="glass-2" note="Overlays: menus, sheets, dialogs" />
            <Surface className="glass-hero" name="glass-hero" note="Landing cards over bright light" />
          </div>
        </Section>

        <Section title="Semantic tints">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Surface className="glass glass-up" name="STOP NOT HIT" note="Gain alert" figure={<Change pct={2.4} />} />
            <Surface className="glass glass-down" name="STOP HIT" note="Loss or destructive" figure={<Change pct={-3.1} />} />
            <Surface className="glass glass-warn" name="DELAYED 15M" note="Stale or partial data" />
            <Surface className="glass glass-paper" name="PAPER" note="Simulated money only" />
          </div>
        </Section>

        <Section title="Type">
          <div className="glass flex flex-col gap-4 rounded-xl p-5">
            <p className="text-silver text-display-xl">Clarity, across every portfolio</p>
            <p className="text-h1">Heading 1, regular</p>
            <p className="text-h2 font-bold">Heading 2</p>
            <p className="text-h3 font-bold">Heading 3</p>
            <p className="text-h4 font-medium">Heading 4</p>
            <p className="text-body">Body. Plain, short and specific.</p>
            <p className="text-body-sm text-fg-2">Body small, secondary</p>
            <p className="text-caption text-fg-3">Caption, the contrast floor</p>
            <p className="text-figure tabular">₹10,42,380.00</p>
          </div>
        </Section>

        <Section title="Sheet">
          <SheetDemo />
        </Section>

        <Section title="Ink and text">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(['bg-ink-0', 'bg-ink-1', 'bg-ink-2', 'bg-ink-3'] as const).map((c) => (
              <div key={c} className={`${c} flex h-20 flex-col justify-end rounded-sm border border-line p-3`}>
                <span className="text-caption text-fg-3">{c}</span>
                <span className="text-body-sm text-fg">fg <span className="text-fg-2">fg-2</span> <span className="text-up">up</span> <span className="text-down">down</span></span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h3 font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Surface({ className, name, note, figure }: { className: string; name: string; note: string; figure?: React.ReactNode }) {
  return (
    <div className={`${className} flex min-h-40 flex-col justify-between gap-6 rounded-xl p-5`}>
      <span className="text-micro uppercase text-fg">{name}</span>
      <div className="flex flex-col gap-1">
        {figure && <span className="text-h3">{figure}</span>}
        <span className="text-body-sm text-fg-2">{note}</span>
        <span className="text-caption text-fg-3">Caption on this surface</span>
      </div>
    </div>
  );
}
