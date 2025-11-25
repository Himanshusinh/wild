/**
 * Helper to optimize Firebase Storage image URLs
 * Since Firebase Storage doesn't have built-in image transformation,
 * we use Next.js Image component with proper sizing to reduce download size
 */

/**
 * Get optimized image URL for Firebase Storage images
 * Note: This is a frontend optimization. For best results, images should be
 * optimized server-side (compressed, resized, converted to WebP/AVIF)
 */
export function optimizeFirebaseImageUrl(
  url: string,
  options?: {
    width?: number;
    quality?: number;
  }
): string {
  // Firebase Storage doesn't support URL-based transformations
  // Return original URL - optimization should be done server-side
  // Next.js Image component will handle responsive sizing
  return url;
}

/**
 * Get responsive image sizes for workflow carousel images
 * Based on display dimensions: max 700px on desktop, 100vw on mobile
 */
export function getWorkflowImageSizes(): string {
  return '(max-width: 768px) 100vw, (max-width: 1024px) 600px, 700px';
}

