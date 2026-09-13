import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This repo keeps a hand-written CLAUDE.md; don't regenerate it on every build.
  agentRules: false,

  typedRoutes: false,

  // The floating dev badge overlaps the sidebar and ends up in captured
  // product screenshots; the route overlay adds nothing we rely on.
  devIndicators: false,

  // Security headers applied to every response.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
