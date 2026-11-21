import path from 'node:path';
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This app lives in a subfolder of a repo with its own lockfile.
  turbopack: { root: path.join(__dirname) },
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Sanity's image CDN, for portfolio images once the CMS is connected.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'gsap'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    // The apex domain always lands on www (canonical host).
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'thegoldnratio.com' }],
        destination: 'https://www.thegoldnratio.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
