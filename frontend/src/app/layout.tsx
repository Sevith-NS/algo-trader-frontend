import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import './globals.css';

/**
 * Root layout. Type is the system Helvetica stack (Arial on Windows and
 * Android): nothing to download, nothing to reflow. Clerk's screens are themed
 * from the same tokens so sign-in looks like the rest of Flint.
 */
export const metadata: Metadata = {
  title: { default: 'Flint', template: '%s · Flint' },
  description: 'A paper-trading desk for global markets: plans with entry, stop and size, risk you can read, and an AI desk that shows its work.',
};

export const viewport: Viewport = {
  themeColor: '#0A0B0B',
  colorScheme: 'dark',
  viewportFit: 'cover',
};

const clerkAppearance = {
  variables: {
    colorPrimary: '#2FBF71',
    colorPrimaryForeground: '#0A0B0B',
    colorBackground: '#111312',
    colorForeground: '#F2F4F3',
    colorMutedForeground: '#A4ACA8',
    colorMuted: '#181B1A',
    colorInput: '#0A0B0B',
    colorInputForeground: '#F2F4F3',
    colorNeutral: '#F2F4F3',
    colorDanger: '#E5484D',
    colorSuccess: '#2FBF71',
    colorWarning: '#D9A23A',
    colorRing: '#2FBF71',
    colorShadow: 'transparent',
    borderRadius: '2px',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider appearance={clerkAppearance}>{children}</ClerkProvider>
      </body>
    </html>
  );
}
