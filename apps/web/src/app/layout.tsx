import type { Metadata, Viewport } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import { headers } from 'next/headers';
import Script from 'next/script';
import { Providers } from '@/components/common/Providers';
import { LocaleHtmlUpdater } from '@/components/common/LocaleHtmlUpdater';
import './globals.css';

const GA_ID = 'G-2S4DR8CBF0';
const YM_ID = process.env.NEXT_PUBLIC_YM_ID ?? '';

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

// Force dynamic rendering so CDN never caches HTML (avoids stale content after deploys)
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#7C3AED',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'WeWatch — Смотреть видео вместе с друзьями онлайн бесплатно',
    template: '%s | WeWatch',
  },
  description:
    'WeWatch (wewatch) — смотри YouTube, VK и Rutube вместе с друзьями. Один на iPhone, другой на сайте — синхронизация работает. Бесплатный watch party с чатом и эмодзи. iOS и Android.',
  authors: [{ name: 'WeWatch', url: APP_URL }],
  creator: 'WeWatch',
  publisher: 'WeWatch',
  category: 'entertainment',
  alternates: {
    canonical: APP_URL,
    languages: {
      'x-default': APP_URL,
      'ru': APP_URL,
      'ru-RU': APP_URL,
      'uz': `${APP_URL}/uz`,
      'en': `${APP_URL}/en`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    alternateLocale: ['uz_UZ', 'en_US'],
    siteName: 'WeWatch',
    url: APP_URL,
    title: 'WeWatch — Смотреть видео вместе с друзьями онлайн',
    description:
      'Бесплатный watch party — смотри YouTube, VK, Rutube с друзьями в реальном времени. Синхронизация, чат, эмодзи. iOS и Android.',
    images: [
      {
        url: '/og-image',
        width: 1200,
        height: 630,
        alt: 'WeWatch — смотри видео вместе с друзьями онлайн бесплатно',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@wewatch_app',
    creator: '@wewatch_app',
    title: 'WeWatch — Смотреть видео вместе с друзьями',
    description:
      'Бесплатный watch party. YouTube, VK, Rutube синхронно с друзьями — чат, эмодзи, iOS и Android.',
    images: ['/og-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
    shortcut: '/favicon-32.png',
  },
  appleWebApp: {
    capable: true,
    title: 'WeWatch',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  other: {
    'application-name': 'WeWatch',
    'mobile-web-app-capable': 'yes',
    'geo.region': 'UZ',
    'geo.placename': 'Uzbekistan',
    'geo.position': '41.2995;69.2401',
    'ICBM': '41.2995, 69.2401',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? '',
  },
};

const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: 'WeWatch',
  applicationCategory: 'EntertainmentApplication',
  applicationSubCategory: 'SocialNetworkingApplication',
  operatingSystem: 'iOS, Android',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Watch YouTube, VK and Rutube together with friends in real time. You pause — everyone pauses. Free watch party with chat, emoji and reactions.',
  url: 'https://wewatch.uz',
  inLanguage: ['ru', 'uz', 'en'],
  featureList: ['watch party', 'YouTube sync', 'VK sync', 'Rutube sync', 'live chat', 'emoji reactions', 'cross-platform iOS Android Web'],
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Middleware sets x-pathname for /uz/* and /en/* (see matcher) — absent header means ru.
  // SSR locale is derived from the URL so <html lang> matches the rendered copy
  // (fixes uz content served under lang="ru") and is passed to Providers.
  const pathname = headers().get('x-pathname') ?? '';
  const isUz = pathname === '/uz' || pathname.startsWith('/uz/');
  const isEn = pathname === '/en' || pathname.startsWith('/en/');
  const lang = isUz ? 'uz' : isEn ? 'en' : 'ru';
  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={`${dmSans.variable} ${oswald.variable} font-body antialiased bg-[#060608] text-white`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        {YM_ID && (
          <>
            <Script src="https://mc.yandex.ru/metrika/tag.js" strategy="afterInteractive" />
            <Script id="ym-init" strategy="afterInteractive">{`
              window.ym = window.ym || function(){(window.ym.a = window.ym.a || []).push(arguments)};
              window.ym.l = 1 * new Date();
              ym(${YM_ID}, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
            `}</Script>
            <noscript><img src={'https://mc.yandex.ru/watch/' + YM_ID} style={{ position: 'absolute', left: '-9999px' }} alt="" /></noscript>
          </>
        )}
        <Providers initialLocale={lang}>
          <LocaleHtmlUpdater />
          {children}
        </Providers>
      </body>
    </html>
  );
}
// build: 2026-05-20T13:50:55Z
