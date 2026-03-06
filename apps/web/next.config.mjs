/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.tmdb.org' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.cinesync.uz' },
      { protocol: 'https', hostname: '**.railway.app' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  async rewrites() {
    const authUrl = process.env.AUTH_SERVICE_URL?.replace('/api/v1/auth', '') ?? 'https://auth-production-47a8.up.railway.app';
    const userUrl = process.env.USER_SERVICE_URL?.replace('/api/v1', '') ?? 'https://user-production-86ed.up.railway.app';
    const contentUrl = process.env.CONTENT_SERVICE_URL?.replace('/api/v1', '') ?? 'https://content-production-4e08.up.railway.app';
    const watchUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'https://watch-part-production.up.railway.app';
    const battleUrl = process.env.BATTLE_SERVICE_URL?.replace('/api/v1', '') ?? 'https://battle-production-238a.up.railway.app';
    const notifUrl = process.env.NOTIFICATION_SERVICE_URL?.replace('/api/v1', '') ?? 'https://notification-production-9c30.up.railway.app';

    return [
      { source: '/auth/:path*', destination: `${authUrl}/api/v1/auth/:path*` },
      { source: '/users/:path*', destination: `${userUrl}/api/v1/users/:path*` },
      { source: '/movies/:path*', destination: `${contentUrl}/api/v1/content/movies/:path*` },
      { source: '/watch-party/:path*', destination: `${watchUrl}/api/v1/watch-party/:path*` },
      { source: '/battles/:path*', destination: `${battleUrl}/api/v1/battles/:path*` },
      { source: '/notifications/:path*', destination: `${notifUrl}/api/v1/notifications/:path*` },
    ];
  },
};

export default nextConfig;
