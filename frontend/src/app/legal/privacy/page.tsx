import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <>
      <h1>Privacy</h1>
      <p className="text-caption text-fg-3">Last updated 11 October 2026</p>
      <p>Flint is a paper-trading tool in an invite-only preview. This page says what we collect, why, and what you can do about it.</p>

      <h2>What we store</h2>
      <ul className="flex flex-col gap-2">
        <li><strong>Your sign-in.</strong> Email, name and security settings are held by Clerk, our sign-in provider. Flint never sees or stores your password.</li>
        <li><strong>Your Flint data.</strong> Preferences, your paper account, every paper fill, watchlists and your AI desk journal, stored in a Postgres database run by Neon. Each row is tied to your account and the database itself refuses to show it to anyone else.</li>
        <li><strong>Operational logs.</strong> Request times, errors and reference codes, kept to run and fix the service. Tokens and keys are removed from logs before they are written.</li>
      </ul>

      <h2>What we send to others</h2>
      <ul className="flex flex-col gap-2">
        <li><strong>AI questions.</strong> When you ask Flint or run the AI desk, your message and a summary of your paper portfolio are sent to Google Gemini to generate the answer.</li>
        <li><strong>Market data requests.</strong> Symbols you look up are requested from public market data sources. Nothing that identifies you is attached.</li>
      </ul>
      <p>We do not sell your data, show ads, or use tracking cookies. The only cookies are the ones Clerk needs to keep you signed in.</p>

      <h2>Your controls</h2>
      <ul className="flex flex-col gap-2">
        <li><strong>Export.</strong> Settings, then Data and privacy, then Export my data downloads everything Flint stores about you.</li>
        <li><strong>Delete.</strong> Delete my account removes your sign-in and all of your Flint data. Deleted journal entries you remove individually can be restored for 30 days first.</li>
        <li><strong>Security.</strong> Turn on two-step verification and review signed-in devices in Settings.</li>
      </ul>

      <h2>Questions</h2>
      <p>Reply to your invitation email and it reaches the person who runs Flint.</p>
    </>
  );
}
