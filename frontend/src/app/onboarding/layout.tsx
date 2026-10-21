import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { serverGet } from '@/lib/server-api';
import type { Profile } from '@/types/api';

export const metadata: Metadata = { title: 'Set up' };

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  await auth.protect();
  const profile = await serverGet<Profile>('/api/me');
  if (profile?.onboarded) redirect('/home');
  return children;
}
