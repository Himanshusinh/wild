'use client';

import React from 'react';
import { BlogPost } from '../data/blogPosts';
import './FeaturedBlogs.css';

interface FeaturedBlogsProps {
  featuredPosts: BlogPost[];
  onPostClick: (post: BlogPost) => void;
}

const FeaturedBlogs: React.FC<FeaturedBlogsProps> = ({ featuredPosts, onPostClick }) => {
  if (!featuredPosts || featuredPosts.length === 0) {
    return null;
  }

  return (
    <section className="featured-blogs">
      <div className="featured-blogs-container">
        <div className="featured-blogs-header">
          <h2 className="featured-blogs-title">Featured Articles</h2>
         
        </div>

        <div className="featured-blogs-grid">
          {featuredPosts.map((post, index) => (
            <article
              key={post.id}
              className="featured-blog-card"
              style={{ animationDelay: `${index * 0.15}s` }}
              onClick={() => onPostClick(post)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPostClick(post);
                }
              }}
            >
              <div className="featured-blog-image">
                {post.image ? (
                  <img
                    src={post.image}
                    alt={post.title}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.parentElement?.querySelector('.featured-blog-image-placeholder') as HTMLElement;
                      if (placeholder) placeholder.style.display = 'block';
                    }}
                  />
                ) : (
                  <div className="featured-blog-image-placeholder"></div>
                )}
              </div>

              <div className="featured-blog-content">
                <span className={`featured-category-tag category-${post.categoryColor}`}>
                  {post.category}
                </span>
                <h3 className="featured-blog-title">{post.title}</h3>
                <p className="featured-blog-description">{post.description}</p>
                <div className="featured-blog-footer">
                  <div className="featured-read-time">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{post.readTime}</span>
                  </div>
                  <svg className="featured-arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBlogs;

