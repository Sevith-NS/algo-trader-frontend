'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import type LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/locomotive-scroll.css';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/**
 * All landing-page motion (docs/DESIGN.md §6.3). The markup is server-rendered
 * finished; this only animates it, so no-JS and reduced-motion visitors get a
 * complete static page. Locomotive Scroll (Lenis underneath) runs on GSAP's
 * ticker so ScrollTrigger stays in sync. One pinned section (real/paper).
 */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();

    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        desktop: '(min-width: 1024px)',
        tall: '(min-height: 700px)',
      },
      (ctx) => {
        const { motion, desktop, tall } = ctx.conditions as { motion: boolean; desktop: boolean; tall: boolean };
        el.dataset.motion = motion ? 'on' : 'off';
        if (!motion) return;
        const pinning = desktop && tall;

        /* ---------------------------------------------- smooth scroll -- */
        let loco: LocomotiveScroll | null = null;
        let cancelled = false;
        import('locomotive-scroll').then(({ default: Loco }) => {
          if (cancelled) return;
          loco = new Loco({
            lenisOptions: { lerp: 0.085, wheelMultiplier: 0.9 },
            scrollCallback: () => ScrollTrigger.update(),
            initCustomTicker: (render) => { gsap.ticker.add(render); },
            destroyCustomTicker: (render) => { gsap.ticker.remove(render); },
          });
          gsap.ticker.lagSmoothing(0);
        });

        // In-page anchors go through Locomotive so the smooth scroll isn't fought.
        const anchors = q<HTMLAnchorElement>('[data-anchor]');
        const onAnchor = (e: MouseEvent) => {
          const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
          if (!href || !loco) return;
          e.preventDefault();
          loco.scrollTo(href, { offset: -80, duration: 1.2 });
        };
        anchors.forEach((a) => a.addEventListener('click', onAnchor));

        // The logo returns to the top through Locomotive, not a same-page reload.
        const logo = q<HTMLAnchorElement>('[data-logo]')[0];
        const onLogo = (e: MouseEvent) => {
          if (!loco) return;
          e.preventDefault();
          loco.scrollTo(0, { duration: 1.2 });
        };
        logo?.addEventListener('click', onLogo);

        /* ------------------------------------------------------- hero -- */
        SplitText.create(q('[data-hero-title]'), {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, { yPercent: 110, duration: 1.3, stagger: 0.1, ease: 'expo.out', delay: 0.1 }),
        });
        gsap.from(q('[data-hero-in]'), { y: 24, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.45 });
        gsap.from(q('[data-hero-card]'), { y: 64, scale: 0.96, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, delay: 0.35 });
        q<SVGPathElement>('[data-draw]').forEach((path) => {
          const len = path.getTotalLength();
          gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', delay: 0.9 });
        });
        if (desktop) {
          // The cards drift a little slower than the page: depth without spectacle.
          gsap.to(q('[data-light-cards]'), {
            yPercent: -8,
            ease: 'none',
            scrollTrigger: { trigger: q('[data-hero]')[0], start: 'top top', end: 'bottom top', scrub: true },
          });
        }

        /* ------------------------------------------------------- tape -- */
        const tape = q('[data-tape]')[0];
        gsap.fromTo(tape, { xPercent: 0 }, {
          xPercent: -30,
          ease: 'none',
          scrollTrigger: { trigger: tape, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        });

        /* --------------------------------------- headings and reveals -- */
        q('[data-split]').forEach((node) => {
          SplitText.create(node, {
            type: 'lines',
            mask: 'lines',
            autoSplit: true,
            onSplit: (self) => gsap.from(self.lines, {
              yPercent: 105, duration: 1.1, stagger: 0.08, ease: 'expo.out',
              scrollTrigger: { trigger: node, start: 'top 85%', toggleActions: 'play none none reverse' },
            }),
          });
        });
        q('[data-reveal]').forEach((node) => {
          gsap.from(node, {
            y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out',
            scrollTrigger: { trigger: node, start: 'top 88%', toggleActions: 'play none none reverse' },
          });
        });
        q('[data-stagger]').forEach((group) => {
          gsap.from(group.children, {
            y: 40, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
            scrollTrigger: { trigger: group, start: 'top 82%', toggleActions: 'play none none reverse' },
          });
        });

        /* ---------------------------- pinned 1: real crossfades to paper -- */
        const rp = q('[data-pin-rp]')[0];
        const paperFace = q('[data-face="paper"]')[0];
        const realFace = q('[data-face="real"]')[0];
        // Without motion the two cards stack; with it they share one spot.
        gsap.set(paperFace, { position: 'absolute', inset: 0, autoAlpha: 0, y: 24 });
        gsap.timeline({
          scrollTrigger: pinning
            ? { trigger: rp, start: 'top top', end: '+=140%', pin: true, scrub: 0.8, anticipatePin: 1 }
            : { trigger: rp, start: 'top 60%', end: 'bottom 60%', scrub: 0.8 },
        })
          .to(realFace, { autoAlpha: 0, y: -24, scale: 0.98, duration: 1 }, 0.3)
          .to(paperFace, { autoAlpha: 1, y: 0, duration: 1 }, 0.5);

        /* ------------------------------------------------------ the plan -- */
        // Not pinned or scrubbed: the chart draws itself once as the section
        // comes into view, so it's never left half drawn mid-scroll.
        const plan = q('[data-plan]')[0];
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: { trigger: plan, start: 'top 65%', toggleActions: 'play none none none' },
        });
        tl.from(q('[data-candle]'), { scaleY: 0, autoAlpha: 0, transformOrigin: '50% 50%', stagger: 0.03, duration: 0.4 })
          .from(q('[data-zone]'), { autoAlpha: 0, duration: 0.4 }, '>-0.2');
        q('[data-level]').forEach((line, i) => {
          tl.from(line, { scaleX: 0, transformOrigin: '0% 50%', duration: 0.5, ease: 'power3.inOut' }, i === 0 ? '>' : '<0.25')
            .from(q('[data-level-label]')[i], { x: 16, autoAlpha: 0, duration: 0.3 }, '<0.2');
        });

        q('[data-ticket-row]').forEach((row) => {
          tl.from(row.children, { autoAlpha: 0.15, duration: 0.25 }, '>-0.1');
        });

        document.fonts?.ready.then(() => ScrollTrigger.refresh());

        return () => {
          cancelled = true;
          anchors.forEach((a) => a.removeEventListener('click', onAnchor));
          logo?.removeEventListener('click', onLogo);
          loco?.destroy();
          gsap.ticker.lagSmoothing(500, 33);
        };
      },
    );
  }, { scope: root });

  return <div ref={root} data-motion="pending">{children}</div>;
}
