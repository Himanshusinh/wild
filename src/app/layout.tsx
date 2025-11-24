import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import AuthBootstrap from "@/components/providers/AuthBootstrap";
import React from 'react'
import { Toaster } from 'react-hot-toast'
import ToastMount from './toast-mount'
import ConsoleSilencer from "@/components/ConsoleSilencer";
import ChromeMount from './chrome-mount'

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
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const artega = localFont({
  src: "../../public/fonts/Artega.otf",
  variable: "--font-artega",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WildMind",
  description: "Your One-Stop AI-Powered Solution for Visual and Branding Needs",
  alternates: {
    canonical: "https://wildmindai.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${artega.variable}`}>
      <head>
        {/* Preconnect to required origins for faster loading */}
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="dns-prefetch" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        {/* Media domains */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://idr01.zata.ai" />
        <link rel="dns-prefetch" href="https://idr01.zata.ai" />
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W8R7DSW7');
          `}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          id="google-analytics-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-S8H5QSFV5Z"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S8H5QSFV5Z');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${artega.variable} antialiased`}
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
          <AuthBootstrap />
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
          <ToastMount />
        </ReduxProvider>
      </body>
    </html>
  );
}
