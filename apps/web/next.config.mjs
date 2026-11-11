import { withSentryConfig } from '@sentry/nextjs';

// Path prefixes owned by the application (everything else is landing / marketing / legal).
// Keep in sync with PROTECTED_PATHS/AUTH_PATHS in src/proxy.ts and DISALLOW in src/app/robots.ts.
const APP_PREFIXES =
  'home|room|friends|messages|notifications|profile|settings|support|login|register|auth|guest|api';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // tsc --noEmit passes locally; shared/src types import express which isn't
    // a web dep — suppress next build's type-check step in CI/Docker
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // One service: the landing (marketing, /uz /ru /en) and the application (/home, /room,
  // /login …) are served from the same host, wewatch.uz. The former app.wewatch.uz host is
  // gone, so there are no app-domain redirects any more.
  async redirects() {
    // Canonical host is the non-www apex. GSC crawled assets on www.wewatch.uz,
    // which means both hosts served content → duplicate-host risk. A single 301
    // from www.* to the apex collapses them regardless of DNS/hosting config.
    const CANONICAL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
    const WWW_HOST = `www.${CANONICAL.replace(/^https?:\/\//, '')}`;
    const wwwRedirect = {
      source: '/:path*',
      has: [{ type: 'host', value: WWW_HOST }],
      destination: `${CANONICAL}/:path*`,
      permanent: true,
    };
    // Three /guides/* pages had English slugs but Russian text inside — duplicates
    // of the Russian guides, which is why they were noindex'd. They have been
    // rewritten as real English guides under /en/guides, so the old URLs redirect
    // there permanently: the slug is what English searchers land on, and it now
    // resolves to a page actually written in English.
    const englishGuideRedirects = [
      'watch-youtube-together',
      'what-is-watch-party',
      'watch-movies-with-friends',
    ].map((slug) => ({
      source: `/guides/${slug}`,
      destination: `/en/guides/${slug}`,
      permanent: true,
    }));

    // Russian moved from the root to its own /ru prefix (T-S193), so every
    // Russian URL that was ever indexed 301s to its new address. These MUST stay
    // in place permanently — they are what carries the existing ranking across,
    // and every one of them is a URL Google already knows.
    //
    // Ordering matters: englishGuideRedirects is spread before this list, so the
    // three English-slug guides reach /en/guides before the catch-all
    // /guides/:slug rule can send them to /ru.
    const ruRoots = [
      'faq', 'how-it-works', 'guides', 'use-cases', 'team', 'tezcode',
      'features', 'pricing', 'products', 'company', 'contact', 'about',
    ];
    // `/` is deliberately NOT in this list. Config redirects run before
    // middleware, so a rule here would answer the request outright and the
    // language detection in src/proxy.ts would never see it. The home page is
    // also the one URL whose destination depends on the visitor, which a
    // permanent redirect cannot express — src/proxy.ts sends it to the locale
    // Accept-Language asks for, with a 307.
    const russianPrefixRedirects = [
      ...ruRoots.map((p) => ({ source: `/${p}`, destination: `/ru/${p}`, permanent: true })),
      ...ruRoots.map((p) => ({
        source: `/${p}/:path*`,
        destination: `/ru/${p}/:path*`,
        permanent: true,
      })),
    ];

    return [
      wwwRedirect,
      ...englishGuideRedirects,
      ...russianPrefixRedirects,
    ];
  },
  async headers() {
    // Marketing / legal pages carry no personalization — safe to cache at the CDN
    // edge. A fresh build on every deploy regenerates them, so no staleness risk.
    const PUBLIC_CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';
    // Every locale is prefixed now, so the list is symmetric across ru/uz/en
    // instead of treating the Russian pages as the unprefixed special case.
    const localized = ['ru', 'uz', 'en'].flatMap((l) => [
      `/${l}`,
      `/${l}/features`, `/${l}/pricing`, `/${l}/products`, `/${l}/company`,
      `/${l}/contact`, `/${l}/about`, `/${l}/faq`, `/${l}/how-it-works`,
      `/${l}/guides/:slug*`, `/${l}/use-cases/:slug*`,
    ]);
    const cacheablePaths = [
      ...localized,
      // Language-neutral legal pages — never moved under a locale prefix.
      '/terms', '/privacy-policy', '/dmca', '/delete-account',
    ];
    return [
      ...cacheablePaths.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: PUBLIC_CACHE }],
      })),
      {
        // Everything else (app shells, auth, API) is never cached. The allowlist
        // above wins for the public pages; this excludes them to avoid a double
        // header. Locale-prefixed pages are excluded as one group now that ru is
        // prefixed too, instead of listing every unprefixed Russian path.
        source:
          '/((?!_next/static|_next/image|favicon\\.ico|ru/|uz/|en/|ru$|uz$|en$|terms$|privacy-policy$|dmca$|delete-account$|$).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        source: `/((?!(?:${APP_PREFIXES})(?:/|$)).*)`,
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // mc.yandex.ru: Yandex Metrica's tag.js. Measured on prod 2026-08-14 — the
              // counter shipped in RootDocument.tsx and NEXT_PUBLIC_YM_ID reached the build
              // (#130), yet every hit was still lost: the browser refused tag.js against
              // this policy before it ever left the machine, so Metrica reported nothing and
              // the server logs showed nothing either. `img-src`/`connect-src` already allow
              // it via the blanket `https:`; only script-src and frame-src were missing.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://mc.yandex.ru",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: wss:",
              // Metrica's webvisor (enabled in the counter's init) renders into an iframe on
              // mc.yandex.ru — without it session recording silently records nothing.
              "frame-src https://www.youtube.com https://youtube.com https://vk.com https://rutube.ru https://mc.yandex.ru",
              "media-src 'self' https: blob:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // The application (formerly app.wewatch.uz): never indexed — robots.ts also
        // disallows these prefixes, and this header covers a crawler that ignores it
        // (Bing indexed /login once, T-Y201 audit, 2026-08-11). Its CSP is wider than
        // the landing's: the room embeds third-party players and arbitrary iframes.
        source: `/:appSeg(${APP_PREFIXES})/:appRest*`,
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            // microphone=(self): the room's voice chat (T-S168) calls getUserMedia from this
            // document; `microphone=()` makes the browser refuse before any prompt. Camera
            // stays disabled — nothing in the app uses it.
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://mc.yandex.ru https://www.youtube.com https://s.ytimg.com https://embed.twitch.tv https://player.vimeo.com https://unpkg.com https://cdn.trovo.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Dev only: a plain-HTTP LAN dev server makes socket.io fall back to ws:, which
              // the policy would otherwise drop silently. Production CSP is unchanged.
              `connect-src 'self' https: wss:${process.env.NODE_ENV === 'development' ? ' http: ws:' : ''}`,
              // `https:` for the generic iframe player (GenericIframePlayer.tsx): the room
              // owner may paste ANY link and, when the server's embed-check says the site
              // allows framing, it is shown in a sandboxed iframe — the host is unknowable
              // in advance. The named hosts stay for documentation.
              "frame-src https: https://www.youtube.com https://youtube.com https://vk.com https://rutube.ru https://embed.twitch.tv https://player.twitch.tv https://www.twitch.tv https://player.vimeo.com https://geo.dailymotion.com https://www.dailymotion.com https://www.tiktok.com https://framatube.org https://peertube.social https://player.trovo.live https://mc.yandex.ru",
              `media-src 'self' https: blob:${process.env.NODE_ENV === 'development' ? ' http:' : ''}`,
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'wewatch',
  project: process.env.SENTRY_PROJECT ?? 'web',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
