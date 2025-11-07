"use client";

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { toThumbUrl } from '@/lib/thumb';

type SmartImageProps = Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL'> & {
	src: string;
	thumbWidth?: number;
	thumbQuality?: number;
	/** Optimized thumbnail URL (pre-generated) */
	thumbnailUrl?: string;
	/** Optimized WebP URL */
	webpUrl?: string;
	/** Base64 blur placeholder */
	blurDataUrl?: string;
	/** If true, renders as decorative (alt="") to avoid alt text flash on load */
	decorative?: boolean;
	// Note: Next/Image onLoadingComplete receives HTMLImageElement
	onLoadingComplete?: (img: HTMLImageElement) => void;
};

/**
 * SmartImage
 * - Prioritizes pre-generated optimized thumbnails (thumbnailUrl, webpUrl, blurDataUrl)
 * - Falls back to API thumbnail proxy for Zata-hosted assets for faster loads
 * - Provides a tiny inline blur placeholder for nicer LQIP
 * - Works with either fill or width/height
 */
const SmartImage: React.FC<SmartImageProps> = ({
	src,
	alt,
	className,
	sizes,
	fill,
	width,
	height,
	priority,
	fetchPriority,
	thumbWidth = 640,
	thumbQuality = 60,
	thumbnailUrl,
	webpUrl,
	blurDataUrl,
	decorative,
	onLoadingComplete,
	...rest
}) => {
	// Very small inline placeholder (light transparent SVG) to avoid layout jank
	const BLUR_PLACEHOLDER =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPTEgaGVpZ2h0PTEgZmlsbD0nI2ZmZicgZmlsbC1vcGFjaXR5PScwLjA1Jy8+PC9zdmc+';

	// Prioritize optimized thumbnails: thumbnailUrl -> webpUrl -> toThumbUrl() -> original
	const optimized = (() => {
		// Use pre-generated thumbnail if available
		if (thumbnailUrl) return thumbnailUrl;
		if (webpUrl) return webpUrl;
		
		// Fall back to on-demand thumbnail generation
		try {
			const u = toThumbUrl(src, { w: thumbWidth, q: thumbQuality });
			return u || src;
		} catch {
			return src;
		}
	})();

	// Use pre-generated blur placeholder if available, otherwise use default
	const finalBlurDataUrl = blurDataUrl || BLUR_PLACEHOLDER;

	// Use empty alt if decorative or alt not provided to prevent caption flashes on load
	const finalAlt = decorative ? '' : (typeof alt === 'string' ? alt : '');
	// Default loading behavior: lazy unless explicitly prioritized
	const loading = (rest as any).loading ?? (priority ? 'eager' : 'lazy');

	return (
		<Image
			src={optimized}
			alt={finalAlt}
			className={className}
			sizes={sizes}
			{...(fill ? { fill: true } : { width, height })}
			placeholder="blur"
			blurDataURL={finalBlurDataUrl}
			priority={priority}
			fetchPriority={fetchPriority}
			loading={loading}
			onLoadingComplete={(img) => {
				try { onLoadingComplete && onLoadingComplete(img); } catch {}
			}}
			{...rest}
		/>
	);
};

export default SmartImage;

