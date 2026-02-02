// Blog Hero Component - Converted from blog-page HomePage.jsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function BlogHero() {
  const router = useRouter();

  return (
    <div className="homepage">
      <div className="container">
        <div className="hero-actions">
          <button
            className="hero-back-button"
            type="button"
            onClick={() => router.push('/view/HomePage')}
            aria-label="Back to home"
          >
            ← Back to Home
          </button>
        </div>

        {/* Main Heading */}
        <h1 className="main-heading">
          <span className="heading-line heading-line-1">Creative Intelligence</span>
          <span className="heading-line heading-line-2">for Modern Brands</span>
        </h1>

        {/* Descriptive Paragraph */}
        <p className="description">
          Discover how generative AI is revolutionizing design timelines, brand consistency, and creative workflows. Learn from industry leaders and unlock new possibilities for your creative projects.
        </p>
      </div>
    </div>
  );
}
