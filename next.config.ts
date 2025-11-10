import type { NextConfig } from "next";

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
};

export default nextConfig;
