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
 * Helper to convert schema object to JSON-LD script tag
 */
export function schemaToJsonLd(schema: any): string {
  return JSON.stringify(schema);
}
