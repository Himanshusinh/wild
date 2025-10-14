import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import React from 'react'
import { Toaster } from 'react-hot-toast'
import ToastMount from './toast-mount'

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'dark';
                  const root = document.documentElement;
                  
                  if (theme === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      root.classList.add('dark');
                      root.classList.remove('light');
                    } else {
                      root.classList.remove('dark');
                      root.classList.add('light');
                    }
                  } else if (theme === 'dark') {
                    root.classList.add('dark');
                    root.classList.remove('light');
                  } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                  }
                } catch (e) {
                  // Default to dark mode if there's an error
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
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
