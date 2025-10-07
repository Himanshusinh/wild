// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // MiniMax
      { protocol: 'http', hostname: 'hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com' },
      { protocol: 'https', hostname: 'hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com' },
      // ngrok (dev)
      { protocol: 'http', hostname: '*.ngrok-free.app' },
      { protocol: 'https', hostname: '*.ngrok-free.app' },
    ],
  },

  async headers() {
    return [
      // Your sign-in page (adjust to your path)
      {
        source: '/signin',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // IMPORTANT: do NOT send COEP on this page
        ],
      },
      // Any other auth UI pages you use
      {
        source: '/auth/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        ],
      },
      // API auth endpoints (NextAuth or your custom)
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
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
