import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Root layout. Type is the system Helvetica stack (Arial on Windows and
 * Android): nothing to download, nothing to reflow. Clerk's screens are themed
 * from the same tokens so sign-in looks like the rest of Polaris.
 */
export const metadata: Metadata = {
  title: { default: 'Polaris', template: '%s · Polaris' },
  description: 'A paper-trading desk for global markets: plans with entry, stop and size, risk you can read, and an AI desk that shows its work.',
};

export const viewport: Viewport = {
  themeColor: '#0B0B0C',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

// The one place raw hex is allowed (T1.9): the theme-color meta and Clerk's
// appearance need literal colours (Clerk derives shades from them). They
// mirror the globals.css tokens; change both together.
const clerkAppearance = {
  variables: {
    colorPrimary: '#F5F5F5',
    colorPrimaryForeground: '#0B0B0C',
    colorBackground: '#161616',
    colorForeground: '#F5F5F5',
    colorMutedForeground: '#B5B5B5',
    colorMuted: '#1C1C1C',
    colorInput: '#0B0B0C',
    colorInputForeground: '#F5F5F5',
    colorNeutral: '#F5F5F5',
    colorDanger: '#FF7A75',
    colorSuccess: '#3DD68C',
    colorWarning: '#E8B04A',
    colorRing: '#F5F5F5',
    colorShadow: 'transparent',
    borderRadius: '10px',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {/* dynamic: render per request so the CSP nonce from proxy.ts reaches
            Next's scripts and Clerk's. A prerendered page has no nonce and
            the policy would block its scripts. */}
        <ClerkProvider appearance={clerkAppearance} dynamic>{children}</ClerkProvider>
      </body>
    </html>
  );
}
