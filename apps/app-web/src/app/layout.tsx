import type { Metadata, Viewport } from 'next';
import { DM_Sans, Oswald } from 'next/font/google';
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.wewatch.uz';

// app.wewatch.uz is the authenticated application — it must NOT be indexed. All
// SEO/marketing metadata lives on the landing (apps/web → wewatch.uz).
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'WeWatch',
    template: '%s | WeWatch',
  },
  description: 'WeWatch — смотрите видео вместе с друзьями.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
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
        {/* TEMP deploy-verification marker — remove once confirmed the fix is live, not a
            permanent feature. See project_web_app_domain_split-adjacent debugging session
            2026-07-22: user reported the same old UI after multiple hard refreshes + a private
            window, so we need an unambiguous signal that bypasses all guessing about JS caching. */}
        <Script id="deploy-marker" strategy="beforeInteractive">{`console.log('%c[WeWatch DEPLOY CHECK] build 2026-07-22T12:05Z — if you see this, the latest code IS live', 'color:#7C3AED;font-weight:bold;font-size:14px;background:#111;padding:4px 8px;border-radius:4px')`}</Script>
        <div style={{ position: 'fixed', bottom: 8, left: 8, zIndex: 99999, background: '#7C3AED', color: 'white', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, fontFamily: 'monospace', pointerEvents: 'none' }}>
          DEPLOY 2026-07-22T12:05Z
        </div>
        <Providers>
          <LocaleHtmlUpdater />
          {children}
        </Providers>
      </body>
    </html>
  );
}
// build: 2026-05-20T13:50:55Z
