import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import AIAssistant from '@/components/AIAssistant';
import { AppShell } from '@/components/shell/AppShell';
import { UserStorage } from '@/components/shell/UserStorage';
import { ToastProvider } from '@/components/ui/Toast';
import { PortfolioProvider } from '@/context/PortfolioContext';
import { serverGet } from '@/lib/server-api';
import type { Profile } from '@/types/api';

/**
 * Everything in (app) is signed-in only, enforced here on the server for every
 * page (not by URL pattern), and every data call is re-checked by the API.
 */
export default async function SignedInLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth.protect();
  const profile = await serverGet<Profile>('/api/me');
  // An API outage should not bounce people to onboarding; only a real "not yet".
  if (profile && !profile.onboarded) redirect('/onboarding');

  return (
    <UserStorage userId={userId}>
      <ToastProvider>
        <PortfolioProvider>
          <AppShell>{children}</AppShell>
          <Suspense fallback={null}>
            <AIAssistant />
          </Suspense>
        </PortfolioProvider>
      </ToastProvider>
    </UserStorage>
  );
}
