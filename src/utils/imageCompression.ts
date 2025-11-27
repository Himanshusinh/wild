export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxBytes?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  convertTo?: 'jpeg' | 'png' | 'webp';
}

export interface ImageCompressionResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  finalSize: number;
  iterations: number;
}

const DEFAULTS: Required<Omit<ImageCompressionOptions, 'maxBytes' | 'convertTo'>> = {
  maxWidth: 2048,
  maxHeight: 2048,
  quality: 0.9,
  mimeType: 'image/jpeg',
};

const MIN_QUALITY = 0.4;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const pickMimeType = (
  options: ImageCompressionOptions
): 'image/jpeg' | 'image/png' | 'image/webp' => {
  if (options.mimeType) return options.mimeType;
  if (options.convertTo === 'png') return 'image/png';
  if (options.convertTo === 'webp') return 'image/webp';
  return 'image/jpeg';
};

async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.decoding = 'async';
    img.src = dataUrl;
  });
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawToCanvas(image: HTMLImageElement, maxWidth: number, maxHeight: number): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = image;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create 2D context');
  }
  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, width, height };
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas conversion failed'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(file: File, options: ImageCompressionOptions = {}): Promise<ImageCompressionResult> {
  const dataUrl = await readFileAsDataURL(file);
  return compressImageDataUrl(dataUrl, {
    ...options,
    mimeType: options.mimeType ?? pickMimeType(options),
  });
}

export async function compressImageDataUrl(dataUrl: string, options: ImageCompressionOptions = {}): Promise<ImageCompressionResult> {
  if (!isBrowser()) {
    const blob = await fetch(dataUrl).then((res) => res.blob());
    return {
      blob,
      dataUrl,
      width: 0,
      height: 0,
      originalSize: blob.size,
      finalSize: blob.size,
      iterations: 0,
    };
  }

  const merged = { ...DEFAULTS, ...options };
  const image = await loadImage(dataUrl);
  const { canvas, width, height } = drawToCanvas(image, merged.maxWidth, merged.maxHeight);

  let quality = merged.quality;
  let blob = await canvasToBlob(canvas, pickMimeType(merged), quality);
  let iterations = 1;

  if (merged.maxBytes) {
    while (blob.size > merged.maxBytes && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.1);
      blob = await canvasToBlob(canvas, pickMimeType(merged), quality);
      iterations += 1;
    }
  }

  const finalDataUrl = await blobToDataUrl(blob);

  return {
    blob,
    dataUrl: finalDataUrl,
    width,
    height,
    originalSize: dataUrl.length,
    finalSize: blob.size,
    iterations,
  };
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

