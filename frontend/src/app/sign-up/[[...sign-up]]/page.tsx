import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Wordmark } from '@/components/shell/AppShell';

export const metadata: Metadata = { title: 'Create your account' };

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center gap-6 px-4 py-10">
      <Link href="/" aria-label="Flint home"><Wordmark /></Link>
      <p className="max-w-sm text-center text-body-sm text-fg-2">
        Flint is invite-only during the preview. Use the email address your invitation was sent to.
      </p>
      <SignUp fallbackRedirectUrl="/onboarding" signInUrl="/sign-in" />
    </div>
  );
}
