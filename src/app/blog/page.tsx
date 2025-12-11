// Blog page metadata for SEO
'use client';

import React from 'react';
import { blogPosts } from './data/blogPosts';
import BlogHero from './components/BlogHero';
import BlogSection from './components/BlogSection';
import FooterNew from '../view/core/FooterNew';
import './components/styles.css';

// Note: In Next.js 13+ App Router, metadata must be exported from a Server Component
// Since this is a Client Component ('use client'), we handle metadata via document.title in useEffect
// For proper SEO, consider creating a separate layout.tsx for the blog route

export default function BlogPage() {
  // Set document title for blog page
  React.useEffect(() => {
    document.title = 'Creative Intelligence Blog | WildMind AI';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover how generative AI is revolutionizing design, branding, and creative workflows. Expert insights and guides from WildMind AI.');
    }
  }, []);

  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <BlogHero />
        <BlogSection blogPosts={blogPosts} />
      </main>
      <FooterNew />
    </>
  );
}
