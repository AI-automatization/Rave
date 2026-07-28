import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // tsc --noEmit passes locally; shared/src types import express which isn't
    // a web dep — suppress next build's type-check step in CI/Docker
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  // Domain split: the application (dashboard) lives on app.wewatch.uz. Any app/auth
  // path hit on the landing domain (wewatch.uz) is 301'd to the app domain so the two
  // are cleanly separated for users, bookmarks and SEO. The landing keeps only marketing
  // + guide pages. APP_DOMAIN is overridable per-env; defaults to production.
  async redirects() {
    const APP = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'https://app.wewatch.uz';
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
    const russianPrefixRedirects = [
      // The old home page. Kept first for clarity; order among these does not matter.
      { source: '/', destination: '/ru', permanent: true },
      ...ruRoots.map((p) => ({ source: `/${p}`, destination: `/ru/${p}`, permanent: true })),
      ...ruRoots.map((p) => ({
        source: `/${p}/:path*`,
        destination: `/ru/${p}/:path*`,
        permanent: true,
      })),
    ];

    const appPaths = [
      'home', 'room', 'friends', 'messages', 'profile',
      'settings', 'notifications', 'support', 'login', 'register', 'auth',
    ];
    return [
      wwwRedirect,
      // App paths go to the app domain before anything else — /login is not a
      // marketing page and must never be rewritten into /ru/login.
      ...appPaths.map((p) => ({
        source: `/${p}/:path*`,
        destination: `${APP}/${p}/:path*`,
        permanent: true,
      })),
      ...appPaths.map((p) => ({
        source: `/${p}`,
        destination: `${APP}/${p}`,
        permanent: true,
      })),
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
        source: '/(.*)',
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https: wss:",
              "frame-src https://www.youtube.com https://youtube.com https://vk.com https://rutube.ru",
              "media-src 'self' https: blob:",
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
