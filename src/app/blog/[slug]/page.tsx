// Dynamic Blog Post Page
'use client';

import { useRouter, useParams } from 'next/navigation';
import { blogPosts } from '../data/blogPosts';
import BlogPostDetail from '../components/BlogPostDetail';
import '../components/styles.css';

export default function BlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // Find the post by ID (slug is the post ID)
  const postId = parseInt(slug);
  const post = blogPosts.find((p: any) => p.id === postId);

  const handleBack = () => {
    router.push('/blog');
  };

  if (!post) {
    return (
      <div className="blog-post-page">
        <div className="blog-post-container">
          <button className="back-button" onClick={handleBack}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Articles
          </button>
          <div className="blog-post-article">
            <h1 className="blog-post-title">Post Not Found</h1>
            <p>The blog post you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return <BlogPostDetail post={post} onBack={handleBack} />;
}
