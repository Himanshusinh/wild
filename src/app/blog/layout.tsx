import type { Metadata } from 'next';
import { blogPosts } from './data/blogPosts';

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
    'WildMind AI blog'
  ],
  openGraph: {
    title: 'Creative Intelligence Blog | WildMind AI',
    description: 'Discover how gener ative AI is revolutionizing design timelines, brand consistency, and creative workflows.',
    type: 'website',
    url: 'https://wildmindai.com/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creative Intelligence Blog | WildMind AI',
    description: 'Discover how generative AI is revolutionizing creative workflows.',
  },
  alternates: {
    canonical: '/blog',
  },
};

// Blog layout to wrap all blog pages with metadata
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
