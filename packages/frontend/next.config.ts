import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@booth2gether/shared'],
  serverExternalPackages: ['@prisma/client'],

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
