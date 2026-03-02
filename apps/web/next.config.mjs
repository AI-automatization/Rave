/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.tmdb.org' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.cinesync.uz' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3001/api/v1/auth/:path*',
      },
      {
        source: '/users/:path*',
        destination: 'http://localhost:3002/api/v1/users/:path*',
      },
      {
        source: '/movies/:path*',
        destination: 'http://localhost:3003/api/v1/content/movies/:path*',
      },
      {
        source: '/watch-party/:path*',
        destination: 'http://localhost:3004/api/v1/watch-party/:path*',
      },
      {
        source: '/battles/:path*',
        destination: 'http://localhost:3005/api/v1/battles/:path*',
      },
      {
        source: '/notifications/:path*',
        destination: 'http://localhost:3007/api/v1/notifications/:path*',
      },
    ];
  },
};

export default nextConfig;
