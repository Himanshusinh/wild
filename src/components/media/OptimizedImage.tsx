'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface OptimizedImageProps {
  /**
   * Original high-res URL (for download/full view)
   */
  src: string;
  
  /**
   * WebP optimized URL (preferred for web display)
   */
  webpUrl?: string;
  
  /**
   * AVIF optimized URL (best compression, optional)
   */
  avifUrl?: string;
  
  /**
   * Thumbnail URL (for grids/lists)
   */
  thumbnailUrl?: string;
  
  /**
   * Base64 blur placeholder
   */
  blurDataUrl?: string;
  
  /**
   * Alt text for accessibility
   */
  alt: string;
  
  /**
   * Display mode: 'thumbnail' for small previews, 'optimized' for normal display, 'original' for full quality
   */
  displayMode?: 'thumbnail' | 'optimized' | 'original';
  
  /**
   * Width (optional, for Next.js Image optimization)
   */
  width?: number;
  
  /**
   * Height (optional, for Next.js Image optimization)
   */
  height?: number;
  
  /**
   * Class name for styling
   */
  className?: string;
  
  /**
   * Object fit style
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  
  /**
   * Priority loading (above the fold)
   */
  priority?: boolean;
  
  /**
   * Quality (1-100, default 85 for optimized, 95 for original)
   */
  quality?: number;
  
  /**
   * Loading strategy
   */
  loading?: 'lazy' | 'eager';
  
  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * OptimizedImage component - Automatically serves the best image format
 * 
 * Features:
 * - Serves WebP/AVIF for modern browsers with fallback
 * - Uses thumbnails for grid views
 * - Blur placeholder for smooth loading
 * - Automatic Next.js Image optimization
 * - Lazy loading by default
 * 
 * @example
 * ```tsx
 * // Grid view with thumbnail
 * <OptimizedImage
 *   src={item.originalUrl}
 *   webpUrl={item.webpUrl}
 *   thumbnailUrl={item.thumbnailUrl}
 *   blurDataUrl={item.blurDataUrl}
 *   alt={item.prompt}
 *   displayMode="thumbnail"
 *   width={300}
 *   height={300}
 * />
 * 
 * // Full view with optimized WebP
 * <OptimizedImage
 *   src={item.originalUrl}
 *   webpUrl={item.webpUrl}
 *   blurDataUrl={item.blurDataUrl}
 *   alt={item.prompt}
 *   displayMode="optimized"
 *   priority
 * />
 * ```
 */
export function OptimizedImage({
  src,
  webpUrl,
  avifUrl,
  thumbnailUrl,
  blurDataUrl,
  alt,
  displayMode = 'optimized',
  width,
  height,
  className = '',
  objectFit = 'cover',
  priority = false,
  quality,
  loading = 'lazy',
  onClick,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const retryRef = useRef(0);

  const withCacheBust = (rawUrl: string, attempt: number) => {
    try {
      if (/^https?:\/\//i.test(rawUrl)) {
        const u = new URL(rawUrl);
        u.searchParams.set('cb', String(Date.now()));
        u.searchParams.set('attempt', String(attempt));
        return u.toString();
      }
      const sep = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${sep}cb=${Date.now()}&attempt=${attempt}`;
    } catch {
      return rawUrl;
    }
  };

  // Determine which URL to use based on display mode
  const getImageUrl = (): string => {
    if (error) return src; // Fallback to original on error

    switch (displayMode) {
      case 'thumbnail':
        return thumbnailUrl || webpUrl || src;
      case 'optimized':
        return webpUrl || src;
      case 'original':
        return src;
      default:
        return webpUrl || src;
    }
  };

  const imageUrl = getImageUrl();

  useEffect(() => {
    retryRef.current = 0;
    try { setError(false); } catch {}
    try { setLoaded(false); } catch {}
  }, [imageUrl]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    try {
      const imgEl = e.currentTarget;
      const attempt = retryRef.current + 1;
      if (attempt <= 3) {
        retryRef.current = attempt;
        const delayMs = attempt === 1 ? 600 : attempt === 2 ? 1600 : 3000;
        setTimeout(() => {
          try {
            if (!imgEl) return;
            const base = imageUrl || src;
            imgEl.src = withCacheBust(base, attempt);
          } catch {}
        }, delayMs);
        return;
      }
    } catch {}

    console.warn('[OptimizedImage] Failed to load after retries:', imageUrl);
    setError(true);
  };

  // Determine quality based on display mode
  const getQuality = (): number => {
    if (quality) return quality;
    
    switch (displayMode) {
      case 'thumbnail':
        return 75;
      case 'optimized':
        return 85;
      case 'original':
        return 95;
      default:
        return 85;
    }
  };

  // Use direct img tag for Zata URLs (bypass Next.js Image optimization)
  if (width && height) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        onClick={onClick}
        style={
          blurDataUrl && !loaded
            ? {
                backgroundImage: `url(${blurDataUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        <img
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : loading}
          decoding="async"
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectFit }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      </div>
    );
  }

  // Use picture element with multiple sources for format fallback
  return (
    <picture className={className} onClick={onClick}>
      {/* AVIF - Best compression, supported by Chrome, Edge, Opera */}
      {avifUrl && !error && (
        <source srcSet={avifUrl} type="image/avif" />
      )}
      
      {/* WebP - Good compression, widely supported */}
      {webpUrl && !error && (
        <source srcSet={webpUrl} type="image/webp" />
      )}
      
      {/* Original - Fallback for older browsers */}
      <img
        src={imageUrl}
        alt={alt}
        loading={priority ? 'eager' : loading}
        className={`w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          objectFit,
          ...(blurDataUrl && !loaded ? {
            backgroundImage: `url(${blurDataUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}),
        }}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </picture>
  );
}

/**
 * OptimizedImageGrid - Grid layout with optimized images
 * 
 * @example
 * ```tsx
 * <OptimizedImageGrid
 *   images={items}
 *   onImageClick={(item, index) => setPreview(item)}
 * />
 * ```
 */
export function OptimizedImageGrid({
  images,
  onImageClick,
  columns = 4,
  gap = 4,
  className = '',
}: {
  images: Array<{
    id: string;
    url: string;
    webpUrl?: string;
    thumbnailUrl?: string;
    blurDataUrl?: string;
    prompt?: string;
  }>;
  onImageClick?: (image: any, index: number) => void;
  columns?: number;
  gap?: number;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }[columns] || 'grid-cols-4';

  const gridGap = {
    2: 'gap-2',
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
  }[gap] || 'gap-4';

  return (
    <div className={`grid ${gridCols} ${gridGap} ${className}`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className="relative aspect-square cursor-pointer rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
          onClick={() => onImageClick?.(image, index)}
        >
          <OptimizedImage
            src={image.url}
            webpUrl={image.webpUrl}
            thumbnailUrl={image.thumbnailUrl}
            blurDataUrl={image.blurDataUrl}
            alt={image.prompt || `Image ${index + 1}`}
            displayMode="thumbnail"
            width={400}
            height={400}
            objectFit="cover"
          />
        </div>
      ))}
    </div>
  );
}

export default OptimizedImage;
