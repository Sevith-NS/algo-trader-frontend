'use client';

import { UserButton } from '@clerk/nextjs';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Search, SlidersHorizontal } from '@/components/ui/icons';
import { CommandPalette } from './CommandPalette';

const NAV = [
  { href: '/home', label: 'Home' },
  { href: '/markets', label: 'Markets' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/news', label: 'News' },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={clsx('font-display text-h4 font-bold tracking-[-0.02em]', className)}>FLINT</span>;
}

/**
 * Signed-in frame: top bar on every screen, bottom tab bar under 1024px so
 * the main destinations sit in thumb reach. Search opens with Ctrl K or /.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const isActive = useActive();
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
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main" className="sr-only z-[70] bg-up px-3 py-2 text-ink-0 focus:not-sr-only focus:fixed focus:left-2 focus:top-2">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-ink-0/95 pt-[env(safe-area-inset-top,0px)] backdrop-saturate-150">
        <div className="mx-auto flex h-12 w-full max-w-[1440px] items-center gap-6 px-4 md:px-6 lg:px-8">
          <Link href="/home" aria-label="Flint home"><Wordmark /></Link>

          <nav aria-label="Main" className="hidden h-full items-stretch gap-6 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}
                    className={clsx('flex items-center border-b-2 text-body-sm transition-colors duration-fast',
                      isActive(n.href) ? 'border-up text-fg' : 'border-transparent text-fg-2 hover:text-fg')}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={openSearch}
                    className="flex h-8 items-center gap-2 rounded-sm border border-control px-2.5 text-body-sm text-fg-3 hover:border-fg-3 hover:text-fg-2 lg:w-64 lg:justify-between">
              <span className="flex items-center gap-2"><Search size={14} /><span className="hidden sm:inline">Search symbols</span></span>
              <kbd className="hidden rounded-sm border border-control px-1.5 text-caption text-fg-2 lg:inline">Ctrl K</kbd>
              <span className="sr-only sm:hidden">Search symbols</span>
            </button>
            <Link href="/settings" className="hidden text-body-sm text-fg-2 hover:text-fg lg:inline">Settings</Link>
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Settings" labelIcon={<SlidersHorizontal size={14} />} href="/settings" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-6 outline-none md:px-6 lg:px-8 lg:pb-12">
        {children}
      </main>

      {/* Links sit left: the bottom-right corner belongs to the Ask Flint button. */}
      <footer className="mx-auto hidden w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-8 py-4 text-caption text-fg-3 lg:flex">
        <span>Paper trading. Educational, not investment advice.</span>
        <span className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-fg-2">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-fg-2">Terms</Link>
        </span>
      </footer>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-ink-0 pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        {NAV.slice(0, 2).map((n) => <TabLink key={n.href} {...n} active={isActive(n.href)} />)}
        <button type="button" onClick={openSearch}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-caption text-fg-3">
          <Search size={18} />
          Search
        </button>
        {NAV.slice(2).map((n) => <TabLink key={n.href} {...n} active={isActive(n.href)} />)}
      </nav>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined}
          className={clsx('flex min-h-14 items-center justify-center border-t-2 text-caption',
            active ? 'border-up text-fg' : 'border-transparent text-fg-3')}>
      {label}
    </Link>
  );
}
