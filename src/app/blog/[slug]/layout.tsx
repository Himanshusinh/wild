import type { Metadata } from 'next';
import { blogPosts } from '../data/blogPosts';
import { generateBlogPostingSchema, generateBreadcrumbSchema } from '@/lib/seo/schemas';

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

  const postUrl = `https://wildmindai.com/blog/${post.id}`;
  const now = new Date().toISOString();
  // Handle optional date properties safely
  const publishedDate = (post as any).publishedAt || (post as any).createdAt || now;
  const modifiedDate = (post as any).updatedAt || publishedDate;

  return {
    title: post.metaTitle || `${post.title} | WildMind AI`,
    description: post.metaDescription || post.description,
    keywords: [
      post.category,
      'WildMind AI',
      'AI blog',
      'generative AI',
      'AI tools',
      'creative AI',
      ...post.title.split(' ').slice(0, 5), // Add first 5 words of title as keywords
    ],
    authors: [{ name: 'WildMind AI' }],
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      type: 'article',
      url: postUrl,
      publishedTime: publishedDate,
      modifiedTime: modifiedDate,
      authors: ['WildMind AI'],
      section: post.category,
      tags: [post.category, 'AI', 'Generative AI', 'Creative Tools'],
      images: post.image ? [{ 
        url: post.image, 
        alt: post.title,
        width: 1200,
        height: 630,
      }] : [],
      siteName: 'WildMind AI',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.description,
      images: post.image ? [post.image] : [],
      creator: '@WildMindAI',
    },
    alternates: {
      canonical: `/blog/${post.id}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Layout for individual blog post pages
export default async function BlogPostLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const postId = parseInt(resolvedParams.slug);
  const post = blogPosts.find((p: any) => p.id === postId);

  if (!post) {
    return <>{children}</>;
  }

  // Generate structured data schemas
  const blogPostingSchema = generateBlogPostingSchema({
    title: post.title,
    description: post.metaDescription || post.description,
    image: post.image,
    publishedAt: (post as any).publishedAt || (post as any).createdAt || undefined,
    updatedAt: (post as any).updatedAt || undefined,
    id: post.id,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://wildmindai.com' },
    { name: 'Blog', url: 'https://wildmindai.com/blog' },
    { name: post.title, url: `https://wildmindai.com/blog/${post.id}` },
  ]);

  return (
    <>
      {/* Article Schema (BlogPosting) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingSchema),
        }}
      />
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
