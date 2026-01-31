import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import MixpanelProvider from "@/components/providers/MixpanelProvider";
import AuthBootstrap from "@/components/providers/AuthBootstrap";
import SubscriptionBootstrap from "@/components/providers/SubscriptionBootstrap";
import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Toaster as SonnerToaster } from 'sonner'
import ToastMount from './toast-mount'
import ConsoleSilencer from "@/components/ConsoleSilencer";
import ChromeMount from './chrome-mount'
import AiCompanion from "@/components/AiCompanion";
import DownloadStatusIndicator from "@/components/DownloadStatusIndicator";
import ModalsContainer from "@/components/modals/ModalsContainer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  // Only load weights actually used: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const artega = localFont({
  src: "../../public/fonts/Artega.otf",
  variable: "--font-artega",
  display: "swap",
});

const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/satoshi/fonts/Satoshi-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/satoshi/fonts/Satoshi-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  title: {
    default: "WildMind AI | AI-Powered Creative Studio",
    template: "%s | WildMind AI"
  },
  description: "WildMind AI is your all-in-one creative studio powered by advanced AI. Generate images, videos, music, and designs instantly. Transform your creative workflow today.",
  keywords: ["AI art generator", "text to video AI", "AI music generator", "creative studio", "WildMind AI", "generative AI", "design tools"],
  authors: [{ name: "WildMind AI Team" }],
  creator: "WildMind AI",
  publisher: "WildMind AI",
  metadataBase: new URL("https://wildmindai.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WildMind AI | AI-Powered Creative Studio",
    description: "Generate images, videos, music, and designs instantly with WildMind AI. Your all-in-one creative studio.",
    url: "https://wildmindai.com",
    siteName: "WildMind AI",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media&token=16944401-2132-474c-9411-68e8afe550e6",
        width: 1200,
        height: 630,
        alt: "WildMind AI Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WildMind AI | AI-Powered Creative Studio",
    description: "Generate images, videos, music, and designs instantly with WildMind AI.",
    creator: "@WildMindAI", // Replace with actual handle if known, or remove
    images: ["https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media&token=16944401-2132-474c-9411-68e8afe550e6"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    // Preload hero video for LCP - will be added via useEffect in HomePage
    // Note: Dynamic preload links are added in HomePage component
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${artega.variable} ${satoshi.variable} ${inter.variable}`}>
      <head>
        {/* Preconnect to required origins - Limit to 4 most critical for performance */}
        {/* Most important: Firebase Storage (LCP images/videos) */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        {/* API Gateway - Critical for data fetching (110ms LCP savings) */}
        <link rel="preconnect" href="https://api-gateway-services-wildmind.onrender.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api-gateway-services-wildmind.onrender.com" />
        {/* Google APIs for auth - DNS prefetch only (not preconnect to stay under 4) */}
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        {/* Google Tag Manager - DNS prefetch only (deferred loading) */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Google Tag Manager - Deferred to reduce blocking */}
        <Script id="google-tag-manager" strategy="lazyOnload">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W8R7DSW7');
          `}
        </Script>
        {/* Google tag (gtag.js) - Deferred to reduce blocking */}
        <Script
          id="google-analytics-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-S8H5QSFV5Z"
          strategy="lazyOnload"
        />
        <Script id="mixpanel-init" strategy="afterInteractive">
        {`
          if (window.mixpanel) {
            window.mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}', {
              debug: ${process.env.NODE_ENV === 'development'},
              track_pageview: true,
              persistence: 'localStorage',
              record_sessions_percent: 100
            });
          }
        `}
      </Script>

      {/* Razorpay SDK - Load before page interactive */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="beforeInteractive"
      />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S8H5QSFV5Z');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${artega.variable} ${satoshi.variable} antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W8R7DSW7"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ReduxProvider>
          <MixpanelProvider />
          <AuthBootstrap />
          <SubscriptionBootstrap />
          <ConsoleSilencer />
          {/* App chrome (Nav + SidePanel) mounted conditionally; hidden on landing page */}
          <ChromeMount />
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              removeDelay: 800,
              style: { background: '#0B0B0B', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
              success: { duration: 2500 },
              error: { duration: 4000 },
            }}
          />
          <SonnerToaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                background: '#0B0B0B',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
              },
            }}
          />
          <ToastMount />
          <DownloadStatusIndicator />
          <AiCompanion />
          <ModalsContainer />
        </ReduxProvider>
      </body>
    </html>
  );
}
