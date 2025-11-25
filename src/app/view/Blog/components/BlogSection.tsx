'use client';

import React, { useMemo, useState } from 'react';
import { BlogPost } from '../data/blogPosts';
import './BlogSection.css';

interface BlogSectionProps {
  blogPosts: BlogPost[];
  onPostClick: (post: BlogPost) => void;
}

const BlogSection: React.FC<BlogSectionProps> = ({ blogPosts, onPostClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const normalized = new Map<string, string>();

    (blogPosts || []).forEach((post) => {
      if (!post || typeof post.category !== 'string') return;
      const trimmed = post.category.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!normalized.has(key)) {
        normalized.set(key, trimmed);
      }
    });

    const sortedCategories = Array.from(normalized.values()).sort((a, b) =>
      a.localeCompare(b)
    );

    return ['all', ...sortedCategories];
  }, [blogPosts]);

  const filteredPosts = useMemo(() => {
    return (blogPosts || []).filter((post) => {
      const matchesCategory =
        selectedCategory === 'all' || post.category === selectedCategory;

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        post.title?.toLowerCase().includes(query) ||
        post.description?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [blogPosts, searchQuery, selectedCategory]);

  return (
    <section className="blog-section">
      <div className="blog-container">
        <div className="blog-filters">
          <div className="search-field-wrapper">
            <label className="search-field">
              <span className="visually-hidden">Search blog posts</span>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                className="search-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 4a7 7 0 0 1 5.473 11.313l3.607 3.607a1 1 0 0 1-1.414 1.414l-3.607-3.607A7 7 0 1 1 11 4zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"
                  fill="currentColor"
                />
              </svg>
            </label>
          </div>

          <div className="category-field-wrapper">
            <label className="category-field">
              <span className="visually-hidden">Filter by category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
              <svg
                className="chevron-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </label>
          </div>
        </div>

        <div className="blog-grid">
          {filteredPosts.map((post, index) => (
            <article 
              key={post.id || index} 
              className="blog-card"
              style={{ animationDelay: `${index * 0.08}s` }}
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
              <div className="blog-card-image">
                {post.image ? (
                  <img 
                    src={post.image} 
                    alt={post.title}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.parentElement?.querySelector('.blog-card-image-placeholder') as HTMLElement;
                      if (placeholder) placeholder.style.display = 'block';
                    }}
                  />
                ) : (
                  <div className="blog-card-image-placeholder"></div>
                )}
              </div>
              <div className="blog-card-content">
                <span className={`category-tag category-${post.categoryColor}`}>
                  {post.category}
                </span>
                <h3 className="blog-card-title">{post.title}</h3>
                <p className="blog-card-description">{post.description}</p>
                <div className="blog-card-footer">
                  <div className="read-time">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{post.readTime}</span>
                  </div>
                  <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </article>
          ))}
          {filteredPosts.length === 0 && (
            <div className="no-results">
              <p>No articles match your search. Try a different keyword or category.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;

