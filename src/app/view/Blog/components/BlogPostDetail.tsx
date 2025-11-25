'use client';

import React, { useEffect } from 'react';
import { BlogPost } from '../data/blogPosts';
import './BlogPostDetail.css';

interface BlogPostDetailProps {
  post: BlogPost;
  onBack: () => void;
}

// Helper function to render content recursively
const renderContent = (content: any, keyPrefix: string = ''): React.ReactNode => {
  if (!content) return null;

  // Handle string content
  if (typeof content === 'string') {
    return renderConclusionWithLinks(content);
  }

  // Handle array content
  if (Array.isArray(content)) {
    return content.map((item, index) => (
      <React.Fragment key={`${keyPrefix}-${index}`}>
        {renderContent(item, `${keyPrefix}-${index}`)}
      </React.Fragment>
    ));
  }

  // Handle object content
  if (typeof content === 'object') {
    const elements: React.ReactNode[] = [];

    // Handle common patterns
    if (content.title && content.text) {
      elements.push(
        <section key={`${keyPrefix}-section`} className="blog-section-content">
          <h2>{content.title}</h2>
          {content.text && <p>{renderConclusionWithLinks(content.text)}</p>}
          {content.items && (
            <ul className={content.numbered ? 'blog-list numbered' : 'blog-list'}>
              {content.items.map((item: string, idx: number) => (
                <li key={`${keyPrefix}-item-${idx}`}>{renderConclusionWithLinks(item)}</li>
              ))}
            </ul>
          )}
          {content.conclusion && <p>{renderConclusionWithLinks(content.conclusion)}</p>}
        </section>
      );
    } else if (content.title) {
      const sectionElements: React.ReactNode[] = [];
      Object.keys(content).forEach((key, keyIndex) => {
        if (key !== 'title') {
          const value = content[key];
          if (Array.isArray(value)) {
            // Handle arrays like solutionItems, growthItems
            sectionElements.push(
              <ul key={`${keyPrefix}-${key}-list`} className="blog-list">
                {value.map((item: string, idx: number) => (
                  <li key={`${keyPrefix}-${key}-item-${idx}`}>{renderConclusionWithLinks(item)}</li>
                ))}
              </ul>
            );
          } else if (value && typeof value === 'object') {
            const rendered = renderContent(value, `${keyPrefix}-${key}`);
            if (rendered) {
              sectionElements.push(
                <React.Fragment key={`${keyPrefix}-${key}-frag`}>
                  {rendered}
                </React.Fragment>
              );
            }
          } else if (typeof value === 'string' && value.trim()) {
            sectionElements.push(<p key={`${keyPrefix}-${key}-p`}>{renderConclusionWithLinks(value)}</p>);
          }
        }
      });
      elements.push(
        <section key={`${keyPrefix}-section`} className="blog-section-content">
          <h2>{content.title}</h2>
          {sectionElements}
        </section>
      );
    } else {
      // Recursively render all properties
      Object.keys(content).forEach((key, keyIndex) => {
        const value = content[key];
        if (Array.isArray(value)) {
          // Handle arrays
          elements.push(
            <ul key={`${keyPrefix}-${key}-list-${keyIndex}`} className="blog-list">
              {value.map((item: string, idx: number) => (
                <li key={`${keyPrefix}-${key}-item-${idx}`}>{renderConclusionWithLinks(item)}</li>
              ))}
            </ul>
          );
        } else if (value && typeof value === 'object') {
          const rendered = renderContent(value, `${keyPrefix}-${key}`);
          if (rendered) {
            elements.push(
              <React.Fragment key={`${keyPrefix}-${key}-frag-${keyIndex}`}>
                {rendered}
              </React.Fragment>
            );
          }
        } else if (typeof value === 'string' && value.trim()) {
          // Render ALL string values, not just specific keys
          elements.push(<p key={`${keyPrefix}-${key}-p-${keyIndex}`}>{renderConclusionWithLinks(value)}</p>);
        }
      });
    }

    return elements.length > 0 ? (
      <>
        {elements.map((element, index) => (
          <React.Fragment key={`${keyPrefix}-elem-${index}`}>
            {element}
          </React.Fragment>
        ))}
      </>
    ) : null;
  }

  return null;
};

  // Helper function to convert "WildMind AI" to blue hyperlink
const renderConclusionWithLinks = (text: string | null | undefined): React.ReactNode => {
  if (!text) return null;
  
  const regex = /(WildMind AI|Wildmind AI)/gi;
  const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part && /^WildMind AI$/i.test(part)) {
        return (
          <a
            key={index}
            href="https://www.wildmindai.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="wildmind-link"
          >
            {part}
          </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post, onBack }) => {
  // Update page title
  useEffect(() => {
    const originalTitle = document.title;
    if (post.metaTitle) {
      document.title = post.metaTitle;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [post]);

  if (!post.content) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-container">
          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Articles
          </button>
          <h1 className="blog-post-title">{post.title}</h1>
          <p className="blog-post-meta">
            <span className="read-time-post">{post.readTime}</span>
          </p>
          <div className="blog-post-content">
            <p>Content coming soon...</p>
          </div>
        </div>
      </div>
    );
  }

  // Extract introduction and conclusion
  const { introduction, conclusion, ...restContent } = post.content;

  return (
    <div className="blog-post-page">
      <div className="blog-post-container">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Articles
        </button>

        <article className="blog-post-article">
          {/* Hero Image */}
          {post.image && (
            <div className="blog-post-hero-image">
              <img src={post.image} alt={post.title} />
            </div>
          )}

          <header className="blog-post-header">
            <h1 className="blog-post-title">{post.title}</h1>
            <div className="blog-post-meta">
              <div className="read-time-post">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {post.readTime}
              </div>
            </div>
          </header>

          <div className="blog-post-content">
            {introduction && (
              <p className="blog-intro">{renderConclusionWithLinks(introduction)}</p>
            )}

            {/* Render all other content dynamically */}
            {renderContent(restContent, 'content')}

            {conclusion && (
              <div className="blog-post-cta">
                <p>{renderConclusionWithLinks(conclusion)}</p>
                      </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPostDetail;
