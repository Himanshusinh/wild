/**
 * SEO Structured Data Schemas (JSON-LD)
 * Following Schema.org specifications for rich snippets in search results
 */

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': string;
    contactType: string;
    email?: string;
  };
}

export interface WebApplicationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
}

export interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  offers: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
  };
}

/**
 * Generate Organization Schema for Homepage
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WildMind AI',
    url: 'https://wildmindai.com',
    logo: 'https://wildmindai.com/icons/wildmind_icon_darkbg.svg',
    description: 'AI-powered creative studio for generating images, videos, music, and designs instantly.',
    sameAs: [
      // Add your social media profiles here
      // 'https://twitter.com/wildmindai',
      // 'https://linkedin.com/company/wildmind-ai',
    ],
  };
}

/**
 * Generate WebApplication Schema for App Pages
 */
export function generateWebApplicationSchema(
  name: string,
  url: string,
  description: string
): WebApplicationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description,
    applicationCategory: 'MultimediaApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

/**
 * Generate Product Schema for Pricing Page
 */
export function generatePricingSchema(): ProductSchema[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'WildMind AI - Free Plan',
      description: 'Start with 4,120 free credits to explore AI-powered creative tools',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    // Add paid plans here when available
  ];
}

/**
 * Generate BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Article Schema for Blog Posts (JSON-LD)
 * Follows Schema.org Article specification for rich snippets
 */
export interface ArticleSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
  articleSection?: string;
  wordCount?: number;
  timeRequired?: string;
}

export function generateArticleSchema(post: {
  title: string;
  description: string;
  image?: string;
  category?: string;
  readTime?: string;
  publishedAt?: string;
  updatedAt?: string;
  id: number;
}): ArticleSchema {
  const siteUrl = 'https://wildmindai.com';
  const postUrl = `${siteUrl}/blog/${post.id}`;
  const now = new Date().toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : undefined,
    datePublished: post.publishedAt || now,
    dateModified: post.updatedAt || post.publishedAt || now,
    author: {
      '@type': 'Organization',
      name: 'WildMind AI',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'WildMind AI',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icons/wildmind_icon_darkbg.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    articleSection: post.category,
    timeRequired: post.readTime || undefined,
  };
}

/**
 * Generate Blog Schema (BlogPosting) - More specific than Article
 */
export interface BlogPostingSchema {
  '@context': string;
  '@type': string;
  headline: string;
  description: string;
  image?: string | string[];
  datePublished?: string;
  dateModified?: string;
  author: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    name: string;
    logo: {
      '@type': string;
      url: string;
    };
  };
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
}

export function generateBlogPostingSchema(post: {
  title: string;
  description: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  id: number;
}): BlogPostingSchema {
  const siteUrl = 'https://wildmindai.com';
  const postUrl = `${siteUrl}/blog/${post.id}`;
  const now = new Date().toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image ? [post.image] : undefined,
    datePublished: post.publishedAt || now,
    dateModified: post.updatedAt || post.publishedAt || now,
    author: {
      '@type': 'Organization',
      name: 'WildMind AI',
    },
    publisher: {
      '@type': 'Organization',
      name: 'WildMind AI',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icons/wildmind_icon_darkbg.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  };
}

/**
 * Generate CollectionPage Schema for Blog Listing
 */
export interface CollectionPageSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  mainEntity: {
    '@type': string;
    numberOfItems: number;
    itemListElement: Array<{
      '@type': string;
      position: number;
      item: {
        '@type': string;
        '@id': string;
        name: string;
      };
    }>;
  };
}

export function generateBlogCollectionSchema(posts: Array<{ id: number; title: string }>): CollectionPageSchema {
  const siteUrl = 'https://wildmindai.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Creative Intelligence Blog | WildMind AI',
    description: 'Discover how generative AI is revolutionizing design, branding, and creative workflows. Expert insights and guides from WildMind AI.',
    url: `${siteUrl}/blog`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          '@id': `${siteUrl}/blog/${post.id}`,
          name: post.title,
        },
      })),
    },
  };
}

/**
 * Helper to convert schema object to JSON-LD script tag
 */
export function schemaToJsonLd(schema: any): string {
  return JSON.stringify(schema);
}
