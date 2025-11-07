import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import AuthBootstrap from "@/components/providers/AuthBootstrap";
import React from 'react'
import { Toaster } from 'react-hot-toast'
import ToastMount from './toast-mount'
import ConsoleSilencer from "@/components/ConsoleSilencer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WildMind",
  description: "Your One-Stop AI-Powered Solution for Visual and Branding Needs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
