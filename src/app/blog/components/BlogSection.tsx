// Blog Section Component - Converted from blog-page BlogSection.jsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BlogPost {
  id: number;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  readTime: string;
  image: string;
  metaTitle?: string;
  metaDescription?: string;
  content: any;
}

interface BlogSectionProps {
  blogPosts: BlogPost[];
}

export default function BlogSection({ blogPosts }: BlogSectionProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCategoryOpen && !(event.target as Element).closest('.custom-dropdown-container')) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryOpen]);

  const categories = useMemo(() => {
    const normalized = new Map();

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

      return matchesCategory;
    });
  }, [blogPosts, selectedCategory]);

  const handlePostClick = (postId: number) => {
    router.push(`/blog/${postId}`);
  };

  return (
    <section className="blog-section">
      <div className="blog-container">
        <div className="blog-filters">

          <div className="tabs">
            {categories.map((category) => (
              <button
                key={category}
                className={`tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category === 'all' ? 'All Resources' : category}
              </button>
            ))}
          </div>
        </div>

        <div className="blog-grid">
          {filteredPosts.map((post, index) => (
            <article
              key={post.id || index}
              className="blog-card"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handlePostClick(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePostClick(post.id);
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
                    }}
                  />
                ) : (
                  <div className="blog-card-image-placeholder">🎨</div>
                )}
              </div>
              <div className="blog-card-content">
                <h3 className="blog-card-title">{post.title}</h3>
                <p className="blog-card-description">{post.description}</p>
                <div className="blog-card-footer">
                  <span className="category-tag">
                    {post.category}
                  </span>
                  <div className="read-time">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{post.readTime}</span>
                  </div>
                  <svg className="arrow-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
}
