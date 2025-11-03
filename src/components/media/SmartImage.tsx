"use client";

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { toThumbUrl, toMediaProxy, toZataPath } from '@/lib/thumb';

type SmartImageProps = Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL'> & {
	src: string;
	thumbWidth?: number;
	thumbQuality?: number;
	// Note: Next/Image onLoadingComplete receives HTMLImageElement
	onLoadingComplete?: (img: HTMLImageElement) => void;
};

/**
 * SmartImage
 * - Uses API thumbnail proxy for Zata-hosted assets for faster loads
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
	onLoadingComplete,
	...rest
}) => {
	// Very small inline placeholder (light transparent SVG) to avoid layout jank
	const BLUR_PLACEHOLDER =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMScgaGVpZ2h0PScxJyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnPjxyZWN0IHdpZHRoPTEgaGVpZ2h0PTEgZmlsbD0nI2ZmZicgZmlsbC1vcGFjaXR5PScwLjA1Jy8+PC9zdmc+';

	// Prefer our thumbnail proxy for Zata paths; fallback to media proxy, then original src
	const optimized = (() => {
		try {
			// Check if this is a Zata URL
			const zataPath = toZataPath(src);
			if (zataPath) {
				// Try thumbnail proxy first
				const thumbUrl = toThumbUrl(src, { w: thumbWidth, q: thumbQuality });
				if (thumbUrl) return thumbUrl;
				// Fallback to media proxy to avoid SSL certificate issues
				const mediaProxyUrl = toMediaProxy(src);
				if (mediaProxyUrl) return mediaProxyUrl;
			}
			// For non-Zata URLs, use original src
			return src;
		} catch {
			return src;
		}
	})();

	return (
		<Image
			src={optimized}
			alt={alt}
			className={className}
			sizes={sizes}
			{...(fill ? { fill: true } : { width, height })}
			placeholder="blur"
			blurDataURL={BLUR_PLACEHOLDER}
			priority={priority}
			fetchPriority={fetchPriority}
			onLoadingComplete={(img) => {
				try { onLoadingComplete && onLoadingComplete(img); } catch {}
			}}
			{...rest}
		/>
	);
};

export default SmartImage;

