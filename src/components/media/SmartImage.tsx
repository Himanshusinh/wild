"use client";

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { toThumbUrl } from '@/lib/thumb';

type SmartImageProps = Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL'> & {
	src: string;
	thumbWidth?: number;
	thumbQuality?: number;
	/** Optimized thumbnail URL (pre-generated) */
	thumbnailUrl?: string;
	/** Optimized AVIF URL (primary format) */
	avifUrl?: string;
	/** Base64 blur placeholder */
	blurDataUrl?: string;
	/** If true, renders as decorative (alt="") to avoid alt text flash on load */
	decorative?: boolean;
	// Note: Next/Image onLoadingComplete receives HTMLImageElement
	onLoadingComplete?: (img: HTMLImageElement) => void;
};

/**
 * SmartImage
 * - Prioritizes pre-generated optimized thumbnails (thumbnailUrl, avifUrl, blurDataUrl)
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
	avifUrl,
	blurDataUrl,
	decorative,
	onLoadingComplete,
	...rest
}) => {
	// Very small inline placeholder (light transparent SVG) to avoid layout jank
	const BLUR_PLACEHOLDER =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPTEgaGVpZ2h0PTEgZmlsbD0nI2ZmZicgZmlsbC1vcGFjaXR5PScwLjA1Jy8+PC9zdmc+';

	// Prioritize optimized thumbnails: thumbnailUrl -> avifUrl -> toThumbUrl() -> original
	const optimized = (() => {
		// Use pre-generated thumbnail if available (small 400x400)
		if (thumbnailUrl) return thumbnailUrl;
		// Use optimized AVIF if available (full-size optimized)
		if (avifUrl) return avifUrl;
		
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

	const [loaded, setLoaded] = useState(false);

	// Use empty alt if decorative or alt not provided to prevent caption flashes on load
	const finalAlt = decorative ? '' : (typeof alt === 'string' ? alt : '');
	// Default loading behavior: lazy unless explicitly prioritized
	const loading = (rest as any).loading ?? (priority ? 'eager' : 'lazy');

	// If optimized is an absolute external URL (not a proxied/thumb URL), render a plain <img>
	// This avoids Next/Image domain/optimization issues for third-party sources and makes
	// thumbnails visible immediately in the home grid.
	let isExternalAbsolute = false;
	try {
		const u = new URL(optimized);
		// Treat same-origin or proxy paths as non-external
		const origin = typeof window !== 'undefined' ? window.location.origin : '';
		if (u.protocol.startsWith('http') && u.origin !== origin) isExternalAbsolute = true;
	} catch {}

	const wrapperStyle = finalBlurDataUrl && !loaded
		? { backgroundImage: `url(${finalBlurDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
		: undefined;

	return (
		<div className={`relative overflow-hidden`} style={wrapperStyle}>
			{isExternalAbsolute ? (
				<img
					src={optimized}
					alt={finalAlt}
					decoding="async"
					loading={(loading as any) || 'lazy'}
					className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
					style={{ objectFit: (fill ? undefined : undefined) }}
					onLoad={(e) => {
						try {
							setLoaded(true);
							onLoadingComplete && onLoadingComplete(e.currentTarget as HTMLImageElement);
						} catch {}
					}}
					onError={() => {
						try { setLoaded(true); } catch {}
					}}
					{...(rest as any)}
				/>
			) : (
				<Image
					src={optimized}
					alt={finalAlt}
					sizes={sizes}
					{...(fill ? { fill: true } : { width, height })}
					// We manage the blur background manually to avoid double-placeholder flicker
					placeholder="empty"
					priority={priority}
					fetchPriority={fetchPriority}
					loading={loading}
					className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
					onLoadingComplete={(img) => {
						try {
							setLoaded(true);
							onLoadingComplete && onLoadingComplete(img as HTMLImageElement);
						} catch {}
					}}
					{...rest}
				/>
			)}
		</div>
	);
};

export default SmartImage;

