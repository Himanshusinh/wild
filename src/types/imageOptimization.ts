/**
 * TypeScript Type Definitions for Image Optimization System
 * 
 * Use these types throughout your application to ensure type safety
 * when working with optimized images.
 */

/**
 * Optimized image object with multiple format URLs
 */
export interface OptimizedImage {
  /**
   * Original high-quality image URL (always present)
   * Use for downloads, full-screen view, and regeneration
   */
  url: string;
  
  /**
   * WebP optimized version (quality 85, max 2048x2048)
   * Primary format for web display
   */
  webpUrl?: string;
  
  /**
   * AVIF optimized version (quality 80, max 2048x2048)
   * Best compression, optional, not always generated
   */
  avifUrl?: string;
  
  /**
   * Thumbnail version (400x400, quality 75)
   * Use in grids and preview lists
   */
  thumbnailUrl?: string;
  
  /**
   * Tiny blur placeholder (20x20, base64 encoded)
   * Display while actual image is loading
   */
  blurDataUrl?: string;
  
  /**
   * Flag indicating optimization has been completed
   * If false or undefined, only original URL is available
   */
  optimized?: boolean;
}

/**
 * Legacy image format (backward compatibility)
 * Old generations may still have images as simple strings
 */
export type LegacyImage = string;

/**
 * Union type for both old and new image formats
 */
export type ImageFormat = OptimizedImage | LegacyImage;

/**
 * Generation document with optimized images
 */
export interface Generation {
  id: string;
  uid: string;
  prompt: string;
  negativePrompt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generationType: 'text-to-image' | 'text-to-video' | 'image-to-image' | 'logo' | 'sticker' | 'product' | 'mockup' | 'ad' | 'music';
  
  /**
   * Images can be either:
   * - Array of OptimizedImage objects (new format)
   * - Array of string URLs (legacy format)
   */
  images: OptimizedImage[] | string[];
  
  /**
   * Video URL for video generations
   */
  videoUrl?: string;
  
  /**
   * Audio URL for music generations
   */
  audioUrl?: string;
  
  createdAt: number;
  updatedAt?: number;
  completedAt?: number;
  error?: string;
  
  // Generation parameters
  width?: number;
  height?: number;
  numOutputs?: number;
  guidanceScale?: number;
  numInferenceSteps?: number;
  seed?: number;
  
  // Credits
  creditsUsed: number;
  
  // Metadata
  provider?: string;
  model?: string;
  duration?: number;
}

/**
 * Helper type guards to check image format
 */

/**
 * Check if image is optimized (has webpUrl or thumbnailUrl)
 */
export function isOptimizedImage(image: ImageFormat): image is OptimizedImage {
  return typeof image === 'object' && ('webpUrl' in image || 'thumbnailUrl' in image);
}

/**
 * Check if image is legacy format (simple string)
 */
export function isLegacyImage(image: ImageFormat): image is LegacyImage {
  return typeof image === 'string';
}

/**
 * Check if generation has optimized images
 */
export function hasOptimizedImages(generation: Generation): boolean {
  if (!generation.images || generation.images.length === 0) {
    return false;
  }
  
  const firstImage = generation.images[0];
  return isOptimizedImage(firstImage);
}

/**
 * Helper functions to safely extract image URLs
 */

/**
 * Get original URL from any image format
 */
export function getOriginalUrl(image: ImageFormat): string {
  if (isLegacyImage(image)) {
    return image;
  }
  return image.url;
}

/**
 * Get optimized URL (WebP if available, otherwise original)
 */
export function getOptimizedUrl(image: ImageFormat): string {
  if (isLegacyImage(image)) {
    return image;
  }
  return image.webpUrl || image.url;
}

/**
 * Get thumbnail URL (thumbnail if available, otherwise WebP, otherwise original)
 */
export function getThumbnailUrl(image: ImageFormat): string {
  if (isLegacyImage(image)) {
    return image;
  }
  return image.thumbnailUrl || image.webpUrl || image.url;
}

/**
 * Get blur placeholder (if available)
 */
export function getBlurDataUrl(image: ImageFormat): string | undefined {
  if (isLegacyImage(image)) {
    return undefined;
  }
  return image.blurDataUrl;
}

/**
 * Get first image from generation
 */
export function getFirstImage(generation: Generation): ImageFormat | null {
  if (!generation.images || generation.images.length === 0) {
    return null;
  }
  return generation.images[0];
}

/**
 * Convert generation images to OptimizedImage array
 * Handles both old and new formats
 */
export function normalizeImages(images: OptimizedImage[] | string[]): OptimizedImage[] {
  return images.map(img => {
    if (typeof img === 'string') {
      // Convert legacy string to OptimizedImage object
      return { url: img, optimized: false };
    }
    return img;
  });
}

/**
 * Props for components that accept image data
 */
export interface ImageComponentProps {
  image: ImageFormat;
  alt: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Props for grid components
 */
export interface ImageGridProps {
  images: ImageFormat[];
  columns?: number;
  gap?: number;
  onImageClick?: (image: ImageFormat, index: number) => void;
  className?: string;
}

/**
 * Backend image optimization result
 */
export interface ImageOptimizationResult {
  webp?: {
    url: string;
    size: number;
    width: number;
    height: number;
  };
  avif?: {
    url: string;
    size: number;
    width: number;
    height: number;
  };
  thumbnail?: {
    url: string;
    size: number;
    width: number;
    height: number;
  };
  blurPlaceholder?: string;
  error?: string;
}

/**
 * Admin API response types
 */

export interface OptimizationJobResult {
  uid: string;
  historyId: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
  imagesProcessed?: number;
}

export interface BulkOptimizationResponse {
  success: boolean;
  processed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  hasMore: boolean;
  nextOffset: number;
  results: OptimizationJobResult[];
}

export interface OptimizationStatsResponse {
  success: boolean;
  stats: {
    totalGenerationsWithImages: number;
    totalOptimized?: number;
    totalPending?: number;
  };
  message?: string;
}

export interface RetryOptimizationResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Usage Examples:
 * 
 * // Type guard usage
 * const image = generation.images[0];
 * if (isOptimizedImage(image)) {
 *   console.log('WebP URL:', image.webpUrl);
 * } else {
 *   console.log('Legacy URL:', image);
 * }
 * 
 * // Helper function usage
 * const thumbnailUrl = getThumbnailUrl(generation.images[0]);
 * const blurDataUrl = getBlurDataUrl(generation.images[0]);
 * 
 * // Component props
 * function ImageCard({ image, alt }: ImageComponentProps) {
 *   return (
 *     <OptimizedImage
 *       src={getOriginalUrl(image)}
 *       webpUrl={isOptimizedImage(image) ? image.webpUrl : undefined}
 *       thumbnailUrl={isOptimizedImage(image) ? image.thumbnailUrl : undefined}
 *       blurDataUrl={getBlurDataUrl(image)}
 *       alt={alt}
 *     />
 *   );
 * }
 * 
 * // Redux state
 * interface HistoryState {
 *   items: Generation[];
 *   loading: boolean;
 *   hasMore: boolean;
 * }
 * 
 * // API response
 * interface GenerationHistoryResponse {
 *   success: boolean;
 *   items: Generation[];
 *   hasMore: boolean;
 *   nextCursor?: string;
 * }
 */
