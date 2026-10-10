import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/shell/AppShell';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 md:px-8">
      <header className="flex h-14 items-center justify-between">
        <Link href="/" aria-label="Flint home"><Wordmark /></Link>
        <nav aria-label="Legal" className="flex gap-4 text-body-sm text-fg-2">
          <Link href="/legal/privacy" className="hover:text-fg">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-fg">Terms</Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-6 py-10 text-body text-fg-2 [&_h1]:text-h2 [&_h1]:font-bold [&_h1]:text-fg [&_h2]:pt-4 [&_h2]:text-h4 [&_h2]:font-bold [&_h2]:text-fg [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-fg">
        {children}
      </main>
    </div>
  );
}
