import { withSentryConfig } from '@sentry/nextjs';

// Avatar/uploads rasmlari user-service diskida saqlanadi va o'sha service
// static serve qiladi (services/user/src/app.ts: app.use('/uploads', ...)) — root'da,
// /api/v1 ostida emas. Backend DB'ga faqat nisbiy yo'l qaytaradi ("/uploads/avatars/x.jpg"),
// shuning uchun brauzer <img src="/uploads/..."> so'rasa, bu app-web'ning o'z domenidan
// so'raladi va u yerda bunday route yo'q — 404, rasm ko'rinmaydi. Mobile buni
// apps/mobile/src/utils/url.ts'dagi resolveMediaUrl() bilan hal qiladi (host bilan to'ldirish);
// web'da esa /uploads/* ni user-service'ga shaffof proxy qilamiz, shunda mavjud barcha
// <img src={avatar}> joylari (AvatarUpload, FriendCard, ChatPanel va h.k.) o'zgarishsiz ishlaydi.
function uploadsOrigin() {
  const railwayEnv = process.env.RAILWAY_SERVICE_USER_URL;
  const base = railwayEnv ? `https://${railwayEnv}` : (process.env.USER_SERVICE_URL ?? 'http://localhost:3002/api/v1');
  return base.replace(/\/api\/v1\/?$/, '');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/uploads/:path*', destination: `${uploadsOrigin()}/uploads/:path*` },
    ];
  },
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
    // Required in Next 14.2 for src/instrumentation.ts (Sentry server/edge init) to load —
    // defaults to false in this version, stabilized without the flag only from Next 15.
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        // Never cache HTML pages in CDN — force revalidation on every deploy
        source: '/((?!_next/static|_next/image|favicon\\.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          // app.wewatch.uz is the application subdomain, not for indexing (robots.txt already
          // has Disallow: /) — this header stops indexing even if a crawler ignores robots.txt
          // or picks up a link before ever fetching it, which is how Bing indexed /login (Yakubov,
          // T-Y201 audit, 2026-08-11).
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            // microphone=(self): the room's voice chat (T-S168) calls getUserMedia from this very
            // document. With `microphone=()` the browser refuses before any permission prompt
            // ("Permissions policy violation: microphone is not allowed in this document") and the
            // voice strip is stuck on "Permission denied" for everyone. Camera stays disabled —
            // nothing in the app uses it.
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.youtube.com https://s.ytimg.com https://embed.twitch.tv https://player.vimeo.com https://unpkg.com https://cdn.trovo.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              // 2026-08-02: local LAN dev testing (phone + laptop against a Mac's plain-HTTP dev
              // server) surfaced that this only ever allowed `wss:` — production's watch-party
              // connection is always TLS (Railway), so this never mattered there. But a dev server
              // with no TLS makes socket.io-client fall back to `ws:` (unencrypted), which this
              // policy silently blocked with zero server-side trace (the browser drops the request
              // before it ever leaves the machine) — looked exactly like "sync doesn't work" with
              // nothing in any log to explain why. `ws:`/`http:` only added in development so
              // production's policy is unchanged.
              `connect-src 'self' https: wss:${process.env.NODE_ENV === 'development' ? ' http: ws:' : ''}`,
              // PeerTube is federated (any domain can run an instance) — frame-src needs exact
              // domains, so this starter list only covers well-known Framasoft-adjacent instances.
              // A link from an instance not listed here gets silently blocked by the browser, not
              // by our code — expand on demand as real rooms need specific instances (see
              // PeerTubePlayer.tsx's file-header comment).
              "frame-src https://www.youtube.com https://youtube.com https://vk.com https://rutube.ru https://embed.twitch.tv https://player.twitch.tv https://www.twitch.tv https://player.vimeo.com https://geo.dailymotion.com https://www.dailymotion.com https://www.tiktok.com https://framatube.org https://peertube.social https://player.trovo.live",
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
