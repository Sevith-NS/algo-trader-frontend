import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Wordmark } from '@/components/shell/AppShell';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center gap-8 px-4 py-10">
      <Link href="/" aria-label="Flint home"><Wordmark /></Link>
      <SignIn fallbackRedirectUrl="/home" signUpUrl="/sign-up" />
    </div>
  );
}
