import type { Metadata, Viewport } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import { Providers } from '@/components/common/Providers';
import { LocaleHtmlUpdater } from '@/components/common/LocaleHtmlUpdater';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-oswald',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#E50914',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'WeWatch — Смотрите видео вместе с друзьями онлайн',
    template: '%s | WeWatch',
  },
  description:
    'WeWatch — приложение для совместного просмотра фильмов и видео онлайн. Смотри YouTube, VK, Rutube с друзьями в реальном времени. Синхронный просмотр, чат, эмодзи. Скачай бесплатно.',
  keywords: [
    'смотреть вместе',
    'совместный просмотр фильмов',
    'watch party',
    'смотреть фильмы онлайн с друзьями',
    'онлайн кинотеатр с друзьями',
    'что делать когда друг далеко',
    'смотреть YouTube вместе',
    'видео с друзьями онлайн',
    'синхронный просмотр видео',
    'развлечения с друзьями онлайн',
    'кино вместе',
    'смотреть видео одновременно',
    'WeWatch',
    'приложение для просмотра фильмов',
    'watch party приложение',
    'смотреть онлайн вместе бесплатно',
  ],
  authors: [{ name: 'WeWatch', url: APP_URL }],
  creator: 'WeWatch',
  publisher: 'WeWatch',
  category: 'entertainment',
  alternates: {
    canonical: APP_URL,
    languages: {
      'ru': APP_URL,
      'uz': APP_URL,
      'en': APP_URL,
      'x-default': APP_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['uz_UZ', 'en_US'],
    siteName: 'WeWatch',
    url: APP_URL,
    title: 'WeWatch — Смотрите видео вместе с друзьями онлайн',
    description:
      'Совместный просмотр фильмов и видео в реальном времени. YouTube, VK, Rutube — смотри с друзьями где бы они ни находились.',
    images: [
      {
        url: '/og-image',
        width: 1200,
        height: 630,
        alt: 'WeWatch — смотрите видео вместе с друзьями',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wewatch_app',
    creator: '@wewatch_app',
    title: 'WeWatch — Смотрите видео вместе с друзьями',
    description:
      'Совместный просмотр фильмов и видео онлайн. Синхронизация, чат, эмодзи — всё бесплатно.',
    images: ['/og-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'WeWatch',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${oswald.variable} font-body antialiased bg-[#060608] text-white`}>
        <Providers>
          <LocaleHtmlUpdater />
          {children}
        </Providers>
      </body>
    </html>
  );
}
// build: 2026-05-20T13:50:55Z
