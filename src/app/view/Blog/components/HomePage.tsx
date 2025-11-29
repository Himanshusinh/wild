'use client';

import { useMemo, useState } from 'react';

import BlogHero from '../blogPage/HomePage';
import FeaturedBlogs from '../blogPage/FeaturedBlogs';
import BlogSection from '../blogPage/BlogSection';
import BlogPostDetail from '../blogPage/BlogPostDetail';
import CTASection from '../blogPage/CTASection';
import { blogPosts } from '../data/blogPosts';

const FEATURED_IDS = [1, 6, 8];

type BlogPost = (typeof blogPosts)[number];

export default function HomePage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const featured = useMemo(
    () => blogPosts.filter((post) => FEATURED_IDS.includes(post.id)),
    []
  );

  const regularPosts = useMemo(
    () => blogPosts.filter((post) => !FEATURED_IDS.includes(post.id)),
    []
  );

  if (selectedPost) {
    return <BlogPostDetail post={selectedPost} onBack={() => setSelectedPost(null)} onPostClick={setSelectedPost} />;
  }

  return (
    <>
      <BlogHero />
      <FeaturedBlogs featuredPosts={featured} onPostClick={setSelectedPost} />
      <BlogSection blogPosts={regularPosts} onPostClick={setSelectedPost} />
      <CTASection />
    </>
  );
}
