import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { Providers } from '@/components/common/Providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#E50914',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: {
    default: 'CineSync — Do\'stlar bilan birga film ko\'ring',
    template: '%s | CineSync',
  },
  description:
    'Ijtimoiy onlayn kinoteatr platformasi. Do\'stlar bilan sinxron film ko\'rish, battle va achievementlar.',
  keywords: ['kinoteatr', 'film', 'watch party', 'do\'stlar', 'online'],
  authors: [{ name: 'CineSync' }],
  creator: 'CineSync',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://cinesync.uz',
  ),
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'CineSync',
    title: 'CineSync — Do\'stlar bilan birga film ko\'ring',
    description: 'Ijtimoiy onlayn kinoteatr platformasi.',
    images: [{ url: '/og-home.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CineSync',
    description: 'Ijtimoiy onlayn kinoteatr platformasi.',
    images: ['/og-home.jpg'],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" data-theme="cinesync" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
