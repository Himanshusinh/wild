'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function BlogHero() {
  const router = useRouter();

  return (
    <div className="blog-index-container">

      <div className="hero">
        <div className="hero-content">
          <h1>Creative Intelligence for Modern Brands</h1>
          <p className="description">
            Discover how generative AI is revolutionizing design timelines, brand consistency, and creative workflows.
            Learn from industry leaders and unlock new possibilities for your creative projects.
          </p>

          {/* <div className="cta-buttons">
            <button 
              className="btn-primary" 
              onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
            >
              Start Exploring ↗
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}
