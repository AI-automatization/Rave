import type { Metadata, Viewport } from 'next';
import type { AbstractIntlMessages } from 'next-intl';
import { DM_Sans, Oswald, Inter, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/components/common/Providers';
import { SOCIAL_PROFILE_URLS } from '@/data/brand';
import { AVAILABLE_OPERATING_SYSTEMS } from '@/data/product-facts';
import enMessages from '../../../messages/en.json';
import ruMessages from '../../../messages/ru.json';
import uzMessages from '../../../messages/uz.json';
import '@/app/globals.css';

const GA_ID = 'G-2S4DR8CBF0';
const YM_ID = process.env.NEXT_PUBLIC_YM_ID ?? '';
const messages = { en: enMessages, ru: ruMessages, uz: uzMessages };

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
  display: 'swap',
});

// Guide-article typography only — see the `.guide-page` scope in globals.css.
// The rest of the site keeps Oswald + DM Sans; the owner asked for the newer
// pair on the guides specifically (2026-08-26).
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const siteViewport: Viewport = {
  themeColor: '#7C3AED',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const siteMetadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'WeWatch — Смотреть видео вместе с друзьями онлайн бесплатно',
    template: '%s | WeWatch',
  },
  description:
    'WeWatch (wewatch) — смотри YouTube, VK и Rutube вместе с друзьями в вебе. Бесплатный watch party с чатом и эмодзи. Приложения для iOS и Android находятся в разработке.',
  authors: [{ name: 'WeWatch', url: APP_URL }],
  creator: 'WeWatch',
  publisher: 'WeWatch',
  category: 'entertainment',
  // No canonical / hreflang here: `/` is a temporary locale redirect and
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
      'Бесплатный watch party — смотри YouTube, VK и Rutube с друзьями в вебе. Приложения для iOS и Android находятся в разработке.',
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
      'Бесплатный watch party в вебе. YouTube, VK и Rutube синхронно с друзьями. Приложения для iOS и Android в разработке.',
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
    // Yandex Webmaster ownership token for wewatch.uz. Hardcoded, unlike the
    // Google one: it is not a secret — the tag is served in the HTML of every
    // page, and Yandex only checks that this exact string is present. Putting it
    // behind an env var would mean the verification silently stops working the
    // day someone deploys without that variable set, which is how the site ends
    // up unverified again without anyone noticing.
    //
    // Yandex matters here beyond Yandex itself: the 2026-08-10 baseline measured
    // 25 pages indexed by Yandex against 60 by Google, and Russia is the largest
    // untapped market in it (1127 impressions at 7.6% CTR). Without Webmaster
    // access that gap cannot be diagnosed at all.
    yandex: 'ea2fda3054e5a5b6',
  },
};

const jsonLdApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'WeWatch',
  applicationCategory: 'EntertainmentApplication',
  applicationSubCategory: 'SocialNetworkingApplication',
  operatingSystem: AVAILABLE_OPERATING_SYSTEMS,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  description: 'Watch YouTube, VK and Rutube together with friends in real time. You pause — everyone pauses. Free watch party with chat, emoji and reactions.',
  url: 'https://wewatch.uz',
  inLanguage: ['ru', 'uz', 'en'],
  featureList: ['watch party', 'YouTube sync', 'VK sync', 'Rutube sync', 'live chat', 'emoji reactions', 'cross-device Web'],
};

// Entity graph: ties WeWatch to its maker tezcode (tezcode.dev) so Google treats
// them as related organizations (parentOrganization + reciprocal sameAs).
const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WeWatch',
  // The name is shared with unrelated brands (a US projector maker, several apps),
  // so the entity carries an explicit alternate name and description.
  alternateName: 'WeWatch UZ',
  description:
    'Watch-party service from Tashkent: watch YouTube, VK Video and Rutube in sync with friends, no extension and no account for guests.',
  url: 'https://wewatch.uz',
  logo: 'https://wewatch.uz/icons/icon-512x512.png',
  // WeWatch's own profiles — this is what lets a brand search for "wewatch"
  // surface Instagram/X/Telegram alongside the site, not just tezcode.dev.
  sameAs: ['https://tezcode.dev', ...SOCIAL_PROFILE_URLS],
  parentOrganization: {
    '@type': 'Organization',
    name: 'tezcode',
    url: 'https://tezcode.dev',
    sameAs: ['https://tezcode.dev'],
  },
};


export function RootDocument({
  children,
  locale,
}: Readonly<{ children: React.ReactNode; locale: 'ru' | 'uz' | 'en' }>) {
  return (
    <html lang={locale}>
      <body className={`${dmSans.variable} ${oswald.variable} ${inter.variable} ${jakarta.variable} font-body antialiased bg-page text-white`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="lazyOnload" />
        <Script id="gtag-init" strategy="lazyOnload">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        {YM_ID && (
          <>
            <Script src="https://mc.yandex.ru/metrika/tag.js" strategy="lazyOnload" />
            <Script id="ym-init" strategy="lazyOnload">{`
              window.ym = window.ym || function(){(window.ym.a = window.ym.a || []).push(arguments)};
              window.ym.l = 1 * new Date();
              ym(${YM_ID}, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
            `}</Script>
            <noscript><img src={'https://mc.yandex.ru/watch/' + YM_ID} style={{ position: 'absolute', left: '-9999px' }} alt="" /></noscript>
          </>
        )}
        <Providers initialLocale={locale} messages={messages[locale] as unknown as AbstractIntlMessages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
// build: 2026-07-06T12:50:00Z
