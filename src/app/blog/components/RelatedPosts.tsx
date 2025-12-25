'use client';

import React from 'react';
import Link from 'next/link';
import { blogPosts } from '../data/blogPosts';

interface RelatedPostsProps {
  currentPostId: number;
  maxPosts?: number;
}

/**
 * Related Posts Component with Internal Linking for SEO
 * Shows related blog posts based on category and provides internal backlinks
 */
export default function RelatedPosts({ currentPostId, maxPosts = 3 }: RelatedPostsProps) {
  const currentPost = blogPosts.find(p => p.id === currentPostId);
  
  if (!currentPost) return null;

  // Find related posts: same category first, then other posts
  const relatedPosts = blogPosts
    .filter(post => post.id !== currentPostId)
    .sort((a, b) => {
      // Prioritize same category
      if (a.category === currentPost.category && b.category !== currentPost.category) return -1;
      if (a.category !== currentPost.category && b.category === currentPost.category) return 1;
      return 0;
    })
    .slice(0, maxPosts);

  if (relatedPosts.length === 0) return null;

  // Get category color class
  const getCategoryClass = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('design') || categoryLower.includes('brand')) return 'category-blue';
    if (categoryLower.includes('tech') || categoryLower.includes('ai')) return 'category-purple';
    if (categoryLower.includes('marketing') || categoryLower.includes('business')) return 'category-green';
    if (categoryLower.includes('creative') || categoryLower.includes('art')) return 'category-pink';
    return 'category-blue'; // default
  };

  return (
    <section className="related-posts-section" aria-label="Related Articles">
      <h2 className="related-posts-title">Related Articles</h2>
      <div className="related-posts-grid">
        {relatedPosts.map((post) => (
          <article key={post.id} className="related-post-card">
            <Link 
              href={`/blog/${post.id}`}
              className="related-post-link"
              rel="related"
              aria-label={`Read article: ${post.title}`}
            >
              {post.image && (
                <div className="related-post-image">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div className="related-post-content">
                <span className={`related-post-category category-tag ${getCategoryClass(post.category)}`}>
                  {post.category}
                </span>
                <h3 className="related-post-title">{post.title}</h3>
                <p className="related-post-description">{post.description}</p>
                {post.readTime && (
                  <span className="related-post-read-time">{post.readTime}</span>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}



