import type { Metadata } from 'next';
import { blogPosts } from '../data/blogPosts';

// Generate dynamic metadata for each blog post
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const postId = parseInt(resolvedParams.slug);
  const post = blogPosts.find((p: any) => p.id === postId);

  if (!post) {
    return {
      title: 'Post Not Found | WildMind AI',
      description: 'The blog post you are looking for could not be found.',
    };
  }

  return {
    title: post.metaTitle || `${post.title} | WildMind AI`,
    description: post.metaDescription || post.description,
    keywords: [
      post.category,
      'WildMind AI',
      'AI blog',
      'generative AI',
      ...post.title.split(' ').slice(0, 5), // Add first 5 words of title as keywords
    ],
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      type: 'article',
      url: `https://wildmindai.com/blog/${post.id}`,
      images: post.image ? [{ url: post.image, alt: post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical: `/blog/${post.id}`,
    },
  };
}

// Layout for individual blog post pages
export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
  params?: Promise<{ slug: string }>;
}) {
  return children;
}
