'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildPollinationsStylePreviewUrl,
  styleNameSvgDataUrl,
} from '@/utils/stylePreviewFallback';

export type StyleThumbnailImageProps = {
  src: string;
  alt: string;
  /** Prefer catalog `prompt`, or grid row `name` + `description` for Indian styles. */
  fallbackPrompt?: string;
  className?: string;
  /** Stabilizes Pollinations seed when the same src is reused in multiple places. */
  instanceKey?: string;
  /** When true, load immediately (style picker surfaces). Default false. */
  eager?: boolean;
};

/**
 * Zata `public/styles/*.avif` thumbnails may fail (403, etc.). Try CDN first, then optional
 * prompt-based preview, then an SVG placeholder so the grid does not stay blank.
 */
export function StyleThumbnailImage({
  src,
  alt,
  fallbackPrompt,
  className,
  instanceKey,
  eager = false,
}: StyleThumbnailImageProps) {
  const chain = useMemo(() => {
    const urls: string[] = [src];
    const p = fallbackPrompt?.trim();
    if (p) {
      urls.push(buildPollinationsStylePreviewUrl(p, `${src}\0${alt}\0${instanceKey ?? ''}`));
    }
    urls.push(styleNameSvgDataUrl(alt));
    return urls;
  }, [src, alt, fallbackPrompt, instanceKey]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [src, alt, fallbackPrompt, instanceKey]);

  const currentSrc = chain[Math.min(idx, chain.length - 1)] ?? src;

  const handleError = useCallback(() => {
    setIdx((i) => (i + 1 < chain.length ? i + 1 : i));
  }, [chain.length]);

  return (
    <img
      key={`${instanceKey ?? alt}-${idx}`}
      src={currentSrc}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      onError={handleError}
    />
  );
}
