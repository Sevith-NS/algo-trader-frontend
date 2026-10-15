'use client';

import { UserButton } from '@clerk/nextjs';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  ChevronRight, NavAlerts, NavHome, NavMarkets, NavMore, NavNews, NavPortfolio, NavSettings, Search, SlidersHorizontal,
  type IconProps,
} from '@/components/ui/icons';
import { Sheet } from '@/components/ui/Sheet';
import { useAlertCount } from '@/lib/useAlertCount';
import { CommandPalette } from './CommandPalette';

type NavItem = { href: string; label: string; icon: ComponentType<IconProps> };

const NAV: NavItem[] = [
  { href: '/home', label: 'Home', icon: NavHome },
  { href: '/markets', label: 'Markets', icon: NavMarkets },
  { href: '/portfolio', label: 'Portfolio', icon: NavPortfolio },
  { href: '/news', label: 'News', icon: NavNews },
  { href: '/alerts', label: 'Alerts', icon: NavAlerts },
];

// Where the bell and the Alerts badges send you: what fired.
const TRIGGERED_HREF = '/alerts?tab=triggered';

// Phone tab bar: the first three NAV items sit in the bar; the rest live in
// the "More" sheet. Watchlists joins it when its route exists (TASKS T4.25).
const MORE: NavItem[] = [
  NAV[3],
  NAV[4],
  { href: '/settings', label: 'Settings', icon: NavSettings },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={clsx('flex items-center gap-2.5 text-fg', className)}>
      <Image src="/polaris-mark.png" alt="" width={28} height={28} priority />
      <span className={clsx('text-h4 font-medium tracking-[-0.03em]', compact && 'sr-only')}>Polaris</span>
    </span>
  );
}

/**
 * Signed-in frame (docs/DESIGN.md §7.6). Laptop and up: a floating glass
 * sidebar (icon rail at lg, full at xl). Phone and tablet: a slim glass top
 * bar plus a floating tab bar in thumb reach. Search opens with Ctrl K or /.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = useActive();
  const moreActive = MORE.some((m) => isActive(m.href));
  const alertCount = useAlertCount();
  const countFor = (href: string) => (href === '/alerts' ? alertCount : 0);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="ambient min-h-[100dvh]">
      <a href="#main" className="sr-only z-[70] rounded-sm bg-fg px-3 py-2 text-ink-0 focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      {/* Laptop and up: floating sidebar. */}
      <aside className="glass fixed bottom-3 left-3 top-3 z-40 hidden w-[76px] flex-col rounded-2xl p-3 lg:flex xl:w-60">
        <Link href="/" aria-label="Polaris, go to the landing page" className="flex h-11 items-center px-2.5">
          <Wordmark className="hidden xl:flex" />
          <Wordmark className="xl:hidden" compact />
        </Link>

        <button type="button" onClick={openSearch}
                className="well mt-4 flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-body-sm text-fg-3 transition-colors duration-fast hover:text-fg xl:justify-between">
          <span className="flex items-center gap-2">
            <Search size={16} />
            <span className="hidden xl:inline">Search</span>
            <span className="sr-only xl:hidden">Search symbols</span>
          </span>
          <kbd className="hidden rounded-sm border border-white/15 px-1.5 text-caption text-fg-2 xl:inline">Ctrl K</kbd>
        </button>

        <nav aria-label="Main" className="mt-6 flex flex-col gap-1">
          {NAV.map((n) => <SideLink key={n.href} item={n} active={isActive(n.href)} count={countFor(n.href)} />)}
        </nav>

        <div className="mt-auto flex flex-col gap-1">
          <SideLink item={{ href: '/settings', label: 'Settings', icon: NavSettings }} active={isActive('/settings')} />
          <div className="mt-3 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Settings" labelIcon={<SlidersHorizontal size={14} />} href="/settings" />
              </UserButton.MenuItems>
            </UserButton>
            <p className="hidden text-caption leading-4 text-fg-3 xl:block">Paper trading is simulated. Not advice.</p>
          </div>
        </div>
      </aside>

      {/* Phone and tablet: slim top bar. */}
      <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 pt-[env(safe-area-inset-top,0px)] lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href="/" aria-label="Polaris, go to the landing page"><Wordmark /></Link>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={openSearch} aria-label="Search symbols"
                    className="grid min-h-11 min-w-11 place-items-center rounded-lg text-fg-2 hover:text-fg">
              <Search size={18} />
            </button>
            <Link href={TRIGGERED_HREF} aria-label={alertCount ? `Alerts, ${alertCount} new` : 'Alerts'}
                  className="relative grid min-h-11 min-w-11 place-items-center rounded-lg text-fg-2 hover:text-fg">
              <NavAlerts size={18} />
              {alertCount > 0 && <CountBadge count={alertCount} className="absolute right-1 top-1.5" />}
            </Link>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Settings" labelIcon={<SlidersHorizontal size={14} />} href="/settings" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>

      <div className="flex min-h-[100dvh] flex-col lg:pl-[88px] xl:pl-[264px]">
        <main id="main" tabIndex={-1}
              className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-32 pt-6 outline-none md:px-6 lg:px-8 lg:pb-12 lg:pt-10">
          {children}
        </main>

        <footer className="mx-auto hidden w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-8 pb-6 text-caption text-fg-3 lg:flex">
          <span>Paper trading is simulated. Analytics are educational, not investment advice.</span>
          <span className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-fg">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-fg">Terms</Link>
          </span>
        </footer>
      </div>

      {/* Phone and tablet: floating tab bar. */}
      <nav aria-label="Main"
           className="glass fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom,0px))] z-40 grid grid-cols-5 rounded-2xl p-1 lg:hidden">
        {NAV.slice(0, 2).map((n) => <TabLink key={n.href} item={n} active={isActive(n.href)} />)}
        <button type="button" onClick={openSearch}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-caption text-fg-3 hover:text-fg">
          <Search size={18} />
          Search
        </button>
        <TabLink item={NAV[2]} active={isActive(NAV[2].href)} />
        <button type="button" onClick={() => setMoreOpen(true)}
                aria-haspopup="dialog" aria-expanded={moreOpen}
                aria-label={alertCount ? `More, ${alertCount} new alert${alertCount === 1 ? '' : 's'}` : undefined}
                className={clsx('relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-caption transition-colors duration-fast',
                  moreActive ? 'bg-white/[0.08] text-fg' : 'text-fg-3 hover:text-fg')}>
          <NavMore size={18} />
          {alertCount > 0 && <CountBadge count={alertCount} className="absolute right-[22%] top-1.5" />}
          More
          {moreActive && <span className="sr-only">(current section)</span>}
        </button>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <nav aria-label="More">
          <ul className="-mx-2 flex flex-col">
            {MORE.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} onClick={() => setMoreOpen(false)} aria-current={isActive(href) ? 'page' : undefined}
                      className={clsx('flex min-h-12 items-center gap-3 rounded-lg px-2 text-body transition-colors duration-fast',
                        isActive(href) ? 'bg-white/[0.08] text-fg' : 'text-fg-2 hover:bg-white/[0.04] hover:text-fg')}>
                  <Icon size={18} />
                  {label}
                  {countFor(href) > 0 && <CountBadge count={countFor(href)} className="ml-1" />}
                  <ChevronRight size={14} className="ml-auto text-fg-3" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Sheet>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

/** New-firings count. The number is the signal; screen readers get "N new" from the link's label. */
function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span aria-hidden="true"
          className={clsx('min-w-[1.125rem] rounded-full bg-fg px-1 text-center text-[11px] font-medium leading-[18px] text-ink-0 tabular', className)}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function SideLink({ item, active, count = 0 }: { item: NavItem; active: boolean; count?: number }) {
  const Icon = item.icon;
  return (
    <Link href={count ? TRIGGERED_HREF : item.href} aria-current={active ? 'page' : undefined} title={item.label}
          aria-label={count ? `${item.label}, ${count} new` : undefined}
          className={clsx(
            'relative flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-body-sm transition-colors duration-fast xl:justify-start',
            active
              ? 'bg-white/[0.08] text-fg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.10)]'
              : 'text-fg-2 hover:bg-white/[0.04] hover:text-fg',
          )}>
      {active && <span aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-fg" />}
      <Icon size={18} />
      <span className="sr-only xl:not-sr-only">{item.label}</span>
      {count > 0 && <CountBadge count={count} className="absolute right-2 top-1.5 xl:static xl:ml-auto" />}
    </Link>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined}
          className={clsx('flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-caption transition-colors duration-fast',
            active ? 'bg-white/[0.08] text-fg' : 'text-fg-3 hover:text-fg')}>
      <Icon size={18} />
      {item.label}
    </Link>
  );
}
