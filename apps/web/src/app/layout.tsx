import type { Metadata, Viewport } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/components/common/Providers';
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
  // No canonical / hreflang here: `/` is a 301 to `/ru` (next.config.mjs) and
  // has no page of its own, so the root layout has no URL to be canonical for.
  // Every page under /ru, /uz and /en declares its own set.
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
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
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

// Entity graph: ties WeWatch to its maker tezcode (tezcode.dev) so Google treats
// them as related organizations (parentOrganization + reciprocal sameAs).
const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WeWatch',
  url: 'https://wewatch.uz',
  logo: 'https://wewatch.uz/icons/icon-512x512.png',
  sameAs: ['https://tezcode.dev'],
  parentOrganization: {
    '@type': 'Organization',
    name: 'tezcode',
    url: 'https://tezcode.dev',
    sameAs: ['https://tezcode.dev'],
  },
};


export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Static shell: lang defaults to ru so the page renders without reading request
  // headers (which would force dynamic rendering of the whole tree). Each locale
  // subtree renders its own content via its LocaleBoundary layout, and the
  // inline script below corrects <html lang> from the URL before hydration.
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${oswald.variable} font-body antialiased bg-[#060608] text-white`}>
        <Script id="set-lang" strategy="beforeInteractive">{`
          (function(){var p=location.pathname.split('/')[1];document.documentElement.lang=(p==='uz'||p==='en')?p:'ru';})();
        `}</Script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
// build: 2026-07-06T12:50:00Z
