'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

const LINKS = [
  { href: '#real-paper', label: 'Portfolio', anim: 'appear--scale', d: '0.16s' },
  { href: '#plan', label: 'Plans', anim: 'appear--soft', d: '0.28s' },
  { href: '#desk', label: 'AI desk', anim: 'appear--scale', d: '0.40s' },
  { href: '#faq', label: 'FAQ', anim: 'appear--soft', d: '0.52s' },
];

/**
 * Landing header: logo, metallic section pills, call to action. Under md the
 * pills fold into a full-screen frosted menu behind a burger. Escape, a link
 * click or growing past md closes it.
 */
export function LandingNav({ logo, cta }: { logo: ReactNode; cta: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const wide = window.matchMedia('(min-width: 768px)');
    const onWide = () => { if (wide.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div data-menu-open={open || undefined}
         className="mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_auto] items-center gap-2 md:h-20 md:grid-cols-[1fr_auto_1fr]">
      <div aria-hidden="true" className="menu-backdrop md:hidden" onClick={() => setOpen(false)} />
      <div className="appear appear--scale relative z-[80] justify-self-start">{logo}</div>
      <nav id="site-nav" aria-label="Sections" className="site-nav hidden items-center gap-2 md:flex">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} data-anchor onClick={() => setOpen(false)}
             className={`metal appear ${l.anim}`} style={{ '--d': l.d } as CSSProperties}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="appear appear--scale relative z-[80] flex items-center gap-2 justify-self-end" style={{ '--d': '0.34s' } as CSSProperties}>
        {cta}
        <button type="button" aria-controls="site-nav" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}
                onClick={() => setOpen((o) => !o)}
                className="burger grid size-11 place-content-center gap-[5px] rounded-full border border-white/15 bg-black/50 hover:border-white/30 hover:bg-white/5 md:hidden">
          <span className="block h-[1.5px] w-4 rounded-full bg-fg" />
          <span className="block h-[1.5px] w-4 rounded-full bg-fg" />
          <span className="block h-[1.5px] w-4 rounded-full bg-fg" />
        </button>
      </div>
    </div>
  );
}
