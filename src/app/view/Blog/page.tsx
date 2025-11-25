'use client';

import React, { useState } from 'react';
import BlogHomePage from './components/BlogHomePage';
import FeaturedBlogs from './components/FeaturedBlogs';
import BlogSection from './components/BlogSection';
import BlogPostDetail from './components/BlogPostDetail';
import CTASection from './components/CTASection';
import { blogPosts, BlogPost } from './data/blogPosts';

const BlogPage: React.FC = () => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Select 3 important featured blogs (IDs: 1, 6, 8)
  const featuredPostIds = [1, 6, 8];
  const featuredPosts = blogPosts.filter(post => featuredPostIds.includes(post.id));
  
  // Exclude featured posts from the main blog list to avoid duplication
  const regularBlogPosts = blogPosts.filter(post => !featuredPostIds.includes(post.id));

  // If a post is selected, show the detail page
  if (selectedPost) {
    return (
      <BlogPostDetail 
        post={selectedPost} 
        onBack={() => setSelectedPost(null)} 
      />
    );
  }

  return (
    <>
      <BlogHomePage />
      <FeaturedBlogs 
        featuredPosts={featuredPosts}
        onPostClick={setSelectedPost}
      />
      <BlogSection 
        blogPosts={regularBlogPosts} 
        onPostClick={setSelectedPost}
      />
      <CTASection />
    </>
  );
};

export default BlogPage;

