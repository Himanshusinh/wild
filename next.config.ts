import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
