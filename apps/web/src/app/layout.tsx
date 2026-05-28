import type { Metadata, Viewport } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
import Script from 'next/script';
import { Providers } from '@/components/common/Providers';
import { LocaleHtmlUpdater } from '@/components/common/LocaleHtmlUpdater';
import './globals.css';

const GA_ID = 'G-2S4DR8CBF0';

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
    default: 'WeWatch — Смотреть видео вместе с друзьями онлайн бесплатно',
    template: '%s | WeWatch',
  },
  description:
    'WeWatch (wewatch) — смотри YouTube, VK и Rutube вместе с друзьями. Один на iPhone, другой на сайте — синхронизация работает. Бесплатный watch party с чатом и эмодзи. iOS и Android.',
  keywords: [
    // RU — высокочастотные запросы
    'смотреть вместе',
    'смотреть вместе онлайн',
    'смотреть фильм вместе онлайн',
    'смотреть фильмы вместе онлайн бесплатно',
    'смотреть кино вместе онлайн',
    'смотреть кино с другом онлайн',
    'смотреть YouTube вместе',
    'смотреть видео с друзьями онлайн',
    'смотреть видео одновременно',
    'совместный просмотр фильмов',
    'совместный просмотр видео онлайн',
    'синхронный просмотр видео',
    'онлайн кинотеатр с друзьями',
    'кино вместе онлайн',
    'кино с другом бесплатно',
    'watch party',
    'watch party приложение',
    'watch party бесплатно',
    'что делать когда друг далеко',
    'развлечения с друзьями онлайн',
    'приложение для просмотра фильмов с друзьями',
    'WeWatch',
    'wewatch',
    'wewatch.uz',
    'wewatch app',
    'вивотч',
    // UZ — o'zbek tilida
    "do'stlar bilan kino ko'rish",
    "do'stlar bilan birga film ko'rish",
    "birga film ko'rish ilovasi",
    "onlayn kino do'stlar bilan",
    "do'stlar bilan video ko'rish",
    "birga kino ko'rish",
    "watch party o'zbekcha",
    "bepul kino ko'rish ilovasi",
    // EN — English search terms
    'watch together online',
    'watch party app',
    'watch youtube together',
    'watch movies together online free',
    'sync watch with friends',
    'watch videos with friends online',
    'free watch party',
    'watch party free app',
    // Cross-platform unique feature
    'смотреть вместе с телефона и компьютера',
    'watch party с телефона',
    'watch party мобильное приложение',
    'совместный просмотр через приложение',
    'смотреть аниме вместе',
    'смотреть аниме с другом онлайн',
    'смотреть сериал вместе онлайн',
    'смотреть сериалы вместе онлайн бесплатно',
  ],
  authors: [{ name: 'WeWatch', url: APP_URL }],
  creator: 'WeWatch',
  publisher: 'WeWatch',
  category: 'entertainment',
  alternates: {
    canonical: APP_URL,
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
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${oswald.variable} font-body antialiased bg-[#060608] text-white`}>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
        <Providers>
          <LocaleHtmlUpdater />
          {children}
        </Providers>
      </body>
    </html>
  );
}
// build: 2026-05-20T13:50:55Z
