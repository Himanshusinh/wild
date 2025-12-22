/**
 * Centralized Page Metadata Configurations
 * Optimized for search engines with unique titles, descriptions, and keywords
 */

import { Metadata } from 'next';

const baseUrl = 'https://wildmindai.com';

/**
 * Page-specific metadata configurations
 */
export const pageMetadata = {
  textToImage: {
    title: 'AI Image Generator - Create Stunning Visuals from Text',
    description: 'Transform text into stunning images with WildMind AI. Advanced AI image generation with multiple models. Create art, photos, and designs in seconds. Start free!',
    keywords: ['AI image generator', 'text to image', 'AI art generator', 'image generation', 'create images with AI'],
    url: `${baseUrl}/text-to-image`,
  },
  
  textToVideo: {
    title: 'AI Video Generator - Transform Text into Professional Videos',
    description: 'Create professional videos from text descriptions with WildMind AI. Advanced AI video generation technology. Perfect for content creators and marketers. Try free!',
    keywords: ['AI video generator', 'text to video', 'video creation', 'AI video maker', 'create videos with AI'],
    url: `${baseUrl}/text-to-video`,
  },
  
  textToMusic: {
    title: 'AI Music Generator - Compose Music with AI Instantly',
    description: 'Generate original music and soundtracks with AI. Create custom music tracks from text descriptions. Perfect for content creators and musicians. Start for free!',
    keywords: ['AI music generator', 'text to music', 'AI composer', 'music creation', 'generate music with AI'],
    url: `${baseUrl}/text-to-music`,
  },
  
  logoGeneration: {
    title: 'AI Logo Maker - Design Professional Logos in Seconds',
    description: 'Create professional logos instantly with WildMind AI. AI-powered logo design for businesses, brands, and projects. No design skills needed. Try free!',
    keywords: ['AI logo maker', 'logo generator', 'logo design', 'business logo', 'create logos with AI'],
    url: `${baseUrl}/logo-generation`,
  },
  
  editImage: {
    title: 'AI Image Editor - Edit and Enhance Photos with AI',
    description: 'Professional AI-powered image editing tools. Remove backgrounds, enhance photos, and apply creative effects instantly with WildMind AI. Start editing free!',
    keywords: ['AI image editor', 'photo editing', 'image enhancement', 'AI photo editor', 'edit images with AI'],
    url: `${baseUrl}/edit-image`,
  },
  
  editVideo: {
    title: 'AI Video Editor - Professional Video Editing with AI',
    description: 'Edit videos effortlessly with AI-powered tools. Cut, trim, enhance, and add effects to your videos. Perfect for content creators. Try free!',
    keywords: ['AI video editor', 'video editing', 'video enhancement', 'AI video tools', 'edit videos with AI'],
    url: `${baseUrl}/edit-video`,
  },
  
  canvasProjects: {
    title: 'WildCanvas - AI-Powered Creative Canvas',
    description: 'Create, edit, and collaborate on creative projects with WildCanvas. Combine AI tools in one powerful workspace. Perfect for designers and creators.',
    keywords: ['creative canvas', 'design workspace', 'AI canvas', 'collaborative design', 'creative tools'],
    url: `${baseUrl}/canvas-projects`,
  },
  
  pricing: {
    title: 'Pricing Plans - Flexible AI Credits for Every Creator',
    description: 'Start free with 4,120 credits. Pay-as-you-go pricing for AI image, video, and music generation. No subscriptions. Only pay for what you use.',
    keywords: ['AI pricing', 'creative AI pricing', 'AI credits', 'image generation pricing', 'flexible pricing'],
    url: `${baseUrl}/view/pricing`,
  },
  
  artStation: {
    title: 'Gallery - Explore AI-Generated Masterpieces | WildMind AI',
    description: 'Browse stunning AI-generated art, images, and videos created by the WildMind AI community. Get inspired and discover what\'s possible with AI creativity.',
    keywords: ['AI art gallery', 'AI generated images', 'creative showcase', 'AI artwork', 'community gallery'],
    url: `${baseUrl}/view/ArtStation`,
  },
} as const;

/**
 * Generate complete metadata object for a page
 */
export function generatePageMetadata(
  pageKey: keyof typeof pageMetadata,
  customMetadata?: Partial<Metadata>
): Metadata {
  const page = pageMetadata[pageKey];
  
  return {
    title: page.title,
    description: page.description,
    keywords: [...page.keywords], // Convert readonly to mutable array
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.url,
      siteName: 'WildMind AI',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-images/${pageKey}.jpg`, // You'll need to create these
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [`${baseUrl}/og-images/${pageKey}.jpg`],
    },
    ...customMetadata,
  };
}

/**
 * Default OG image fallback
 */
export const defaultOgImage = 'https://firebasestorage.googleapis.com/v0/b/wild-mind-ai.firebasestorage.app/o/core%2FAsset%203wildmind%20logo%20text.svg?alt=media&token=16944401-2132-474c-9411-68e8afe550e6';
