import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      // MiniMax image domains
      {
        protocol: 'http',
        hostname: 'hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com',
      },
      {
        protocol: 'https',
        hostname: 'hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com',
      },
      // Local API domains (ngrok)
      {
        protocol: 'http',
        hostname: '*.ngrok-free.app',
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.app',
      },
    ],
  },
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast', '@tabler/icons-react', 'motion'],
  },
  // Compress output
  compress: true,
  // Note: swcMinify is enabled by default in Next.js 15+
  async headers() {
    // Ensure correct content-type for XML sitemaps on Vercel/Next
    return [
      {
        source: '/:path*.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/HomePage', destination: '/view/HomePage' },
      { source: '/Landingpage', destination: '/view/Landingpage' },
    ];
  },
  // Remove all console.* calls in production automatically as a safeguard.
  // We still explicitly strip calls in source, but this guarantees a clean build.
  compiler: isDev ? undefined : {
    removeConsole: {
      exclude: ['error', 'warn']
    }
  },
};

export default nextConfig;
