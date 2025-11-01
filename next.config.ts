import type { NextConfig } from 'next';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  allowedDevOrigins: process.env.REPLIT_DEV_DOMAIN
    ? [
        process.env.REPLIT_DEV_DOMAIN,
        `https://${process.env.REPLIT_DEV_DOMAIN}`,
        `http://${process.env.REPLIT_DEV_DOMAIN}`,
        '127.0.0.1',
        'localhost',
      ]
    : [],
  // Keep ESLint and TS out of build for speed; CI runs typecheck separately
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default withBundleAnalyzer(nextConfig);
