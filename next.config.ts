import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "idr01.zata.ai",
      },
      {
        protocol: "https",
        hostname: "editor-image.wildmindai.com",
      },
      {
        protocol: "https",
        hostname: "wildmindai.com",
      },
      {
        protocol: "https",
        hostname: "www.wildmindai.com",
      },
      // MiniMax image domains
      {
        protocol: "http",
        hostname: "hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com",
      },
      {
        protocol: "https",
        hostname: "hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com",
      },
      // Local API domains (ngrok)
      {
        protocol: "http",
        hostname: "*.ngrok-free.app",
      },
      {
        protocol: "https",
        hostname: "*.ngrok-free.app",
      },
    ],
  },
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-hot-toast",
      "@tabler/icons-react",
      "motion",
    ],
    // Enable partial prerendering for better performance
    ppr: false,
  },
  // Target modern browsers to reduce legacy JavaScript polyfills (11 KiB savings)
  // Next.js 15+ uses SWC which targets modern browsers by default, but we can be explicit
  transpilePackages: [],
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  // Compress output
  compress: true,
  // Note: swcMinify is enabled by default in Next.js 15+
  async headers() {
    // Ensure correct content-type for XML sitemaps on Vercel/Next
    const headers = [
      {
        source: "/:path*.xml",
        headers: [{ key: "Content-Type", value: "application/xml" }],
      },
      {
        source: "/robots.txt",
        headers: [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
      },
    ];

    // Add performance headers for static assets
    if (!isDev) {
      headers.push(
        {
          source:
            "/:path*.(woff|woff2|ttf|otf|jpg|jpeg|png|gif|svg|webp|avif|mp4|webm)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
        // Cache headers for API proxy routes (Zata images)
        {
          source: "/api/proxy/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
      );
    }

    return headers;
  },
  async rewrites() {
    return [
      { source: "/HomePage", destination: "/view/HomePage" },
      { source: "/Landingpage", destination: "/view/Landingpage" },
    ];
  },
  async redirects() {
    return [
      // Firebase sends password reset / email verification links to
      // https://[authDomain]/__/auth/action?mode=resetPassword&oobCode=...
      // Since we use Next.js (not Firebase Hosting), there is no built-in handler.
      // This redirect routes Firebase action URLs to our own /auth/reset-password page
      // so the user lands on our form instead of being intercepted by the auth middleware.
      {
        source: "/__/auth/action",
        destination: "/auth/reset-password",
        permanent: false,
      },
    ];
  },
  // Remove all console.* calls in production automatically as a safeguard.
  // We still explicitly strip calls in source, but this guarantees a clean build.
  compiler: isDev
    ? undefined
    : {
        removeConsole: {
          exclude: ["error", "warn"],
        },
      },
  // Force fresh build ID on every deployment to prevent chunk name collisions
  // and force CDNs to recognize new assets.
  generateBuildId: async () => {
    return new Date().getTime().toString();
  },
  // Explicitly set Turbopack root to avoid incorrect inference when multiple lockfiles exist
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config) => {
    config.resolve.alias["@image-edit"] = path.join(
      process.cwd(),
      "src/image_edit",
    );
    return config;
  },
};

export default nextConfig;
