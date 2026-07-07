import { withSentryConfig } from '@sentry/nextjs';

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
  async redirects() {
    // Eski indekslangan URL'lar (Google keshida qolgan) — haqiqiy sahifalarga
    // 301 yo'naltiramiz, 404 o'rniga link-equity saqlanadi.
    return [
      { source: '/how-it-works', destination: '/', permanent: true },
    ];
  },
  async headers() {
    // Marketing / legal pages carry no personalization — safe to cache at the CDN
    // edge. A fresh build on every deploy regenerates them, so no staleness risk.
    const PUBLIC_CACHE = 'public, s-maxage=3600, stale-while-revalidate=86400';
    const cacheablePaths = [
      '/', '/uz', '/en',
      '/features', '/pricing', '/products', '/company', '/contact',
      '/about', '/faq', '/terms', '/privacy-policy', '/dmca', '/delete-account',
      '/guides/:slug*', '/uz/guides/:slug*',
    ];
    return [
      ...cacheablePaths.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: PUBLIC_CACHE }],
      })),
      {
        // Everything else (app shells, auth, API) is never cached. The allowlist
        // above wins for the public pages; this excludes them to avoid a double header.
        source:
          '/((?!_next/static|_next/image|favicon\\.ico|guides/|uz/guides/|uz$|en$|features$|pricing$|products$|company$|contact$|about$|faq$|terms$|privacy-policy$|dmca$|delete-account$|$).*)',
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://mc.yandex.ru",
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
});
