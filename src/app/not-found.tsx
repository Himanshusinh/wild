'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * Custom 404 - Not Found Page
 * This page has its own standalone layout without chrome (Nav/SidePanel) or AI companion
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-[#0a0a0f] to-black text-white p-6 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent animate-pulse" />
      
      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* 404 Number with gradient */}
        <div className="relative">
          <h1 className="text-9xl font-black bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold">Page Not Found</h2>
          <p className="text-lg text-white/70">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => router.back()}
            className="group px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </span>
          </button>

          <Link
            href="/"
            className="group px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
            <span className="flex items-center gap-2 font-medium">
              Go Home
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </span>
          </Link>
        </div>

        {/* Helpful links */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-white/50 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/text-to-image" className="text-sm text-white/70 hover:text-white transition-colors underline decoration-white/30 hover:decoration-white">
              Text to Image
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/text-to-video" className="text-sm text-white/70 hover:text-white transition-colors underline decoration-white/30 hover:decoration-white">
              Text to Video
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/view/pricing" className="text-sm text-white/70 hover:text-white transition-colors underline decoration-white/30 hover:decoration-white">
              Pricing
            </Link>
            <span className="text-white/30">•</span>
            <Link href="/view/ArtStation" className="text-sm text-white/70 hover:text-white transition-colors underline decoration-white/30 hover:decoration-white">
              Gallery
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
    </div>
  );
}
