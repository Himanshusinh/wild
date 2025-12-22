import type { Metadata } from 'next';
import { blogPosts } from './data/blogPosts';
import { generateBlogCollectionSchema, generateBreadcrumbSchema } from '@/lib/seo/schemas';

// Generate metadata for the blog listing page
export const metadata: Metadata = {
  title: 'Creative Intelligence Blog | WildMind AI',
  description: 'Discover how generative AI is revolutionizing design, branding, and creative workflows. Expert insights and guides from WildMind AI.',
  keywords: [
    'AI blog',
    'generative AI insights',
    'creative AI',
    'AI branding',
    'AI design',
    'creative workflows',
    'WildMind AI blog',
    'AI tools',
    'AI tutorials',
  ],
  openGraph: {
    title: 'Creative Intelligence Blog | WildMind AI',
    description: 'Discover how generative AI is revolutionizing design timelines, brand consistency, and creative workflows.',
    type: 'website',
    url: 'https://wildmindai.com/blog',
    siteName: 'WildMind AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creative Intelligence Blog | WildMind AI',
    description: 'Discover how generative AI is revolutionizing creative workflows.',
    creator: '@WildMindAI',
  },
  alternates: {
    canonical: '/blog',
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

// Blog layout to wrap all blog pages with metadata
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate CollectionPage schema for blog listing
  const collectionSchema = generateBlogCollectionSchema(
    blogPosts.map(post => ({ id: post.id, title: post.title }))
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://wildmindai.com' },
    { name: 'Blog', url: 'https://wildmindai.com/blog' },
  ]);

  return (
    <>
      {/* CollectionPage Schema for Blog Listing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
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
