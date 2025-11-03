"use client";

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { toThumbUrl, toMediaProxy, toZataPath } from '@/lib/thumb';

type SmartImageProps = Omit<ImageProps, 'src' | 'placeholder' | 'blurDataURL'> & {
	src: string;
	thumbWidth?: number;
	thumbQuality?: number;
	/**
	 * Optional dominant/base color for the SVG LQ placeholder.
	 * Accepts hex/rgb/rgba. Defaults to a neutral gray.
	 */
	placeholderColor?: string;
	/**
	 * Optional highlight color for shimmer. Defaults to a lighter gray.
	 */
	placeholderHighlight?: string;
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
	placeholderColor,
	placeholderHighlight,
	onLoadingComplete,
	...rest
}) => {
	// Create a tiny SVG shimmer placeholder for better LQ perception
	const toBase64 = (str: string) =>
		typeof window === 'undefined'
			? Buffer.from(str).toString('base64')
			: window.btoa(str);

	const shimmer = (
		w: number = 32,
		h: number = 20,
		base: string = placeholderColor || '#eaeaea',
		highlight: string = placeholderHighlight || '#f5f5f5'
	) => `
		<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
			<defs>
				<linearGradient id="g">
					<stop stop-color="${base}" offset="20%" />
					<stop stop-color="${highlight}" offset="50%" />
					<stop stop-color="${base}" offset="80%" />
				</linearGradient>
			</defs>
			<rect width="100%" height="100%" fill="${base}" />
			<rect id="r" width="100%" height="100%" fill="url(#g)" />
			<animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite"  />
		</svg>`;

	const BLUR_PLACEHOLDER = `data:image/svg+xml;base64,${toBase64(
		shimmer(
			(typeof width === 'number' ? Math.max(16, width) : 32) as number,
			(typeof height === 'number' ? Math.max(12, height) : 20) as number
		)
	)}`;

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

