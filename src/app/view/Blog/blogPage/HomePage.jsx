'use client';

import { useRouter } from 'next/navigation';
import './HomePage.css'

function HomePage() {
  const router = useRouter();

  return (
    <div className="homepage">
      <div className="container">
        {/* Logo */}
        <img 
          src="/icons/wildmindai logo white.svg" 
          alt="Wild Mind AI Logo" 
          className="blog-logo"
        />
        
        {/* Back Button */}
        <div className="blog-header-wrapper">
          <button 
            onClick={() => router.back()}
            className="blog-back-button"
            aria-label="Go back"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </button>
        </div>

        {/* Main Heading */}
        <h1 className="main-heading">
          <span className="heading-line heading-line-1 text-4xl font-semibold text-center">Creative Intelligence</span>
          <span className="heading-line heading-line-2">for Modern Brands</span>
        </h1>

        {/* Descriptive Paragraph */}
        <p className="description">
          Discover how generative AI is revolutionizing design timelines, brand consistency, and creative workflows. Learn from industry leaders and unlock new possibilities for your creative projects.
        </p>
      </div>
    </div>
  )
}

export default HomePage
