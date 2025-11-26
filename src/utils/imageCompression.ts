export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

const loadImageElement = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
};

/**
 * Compresses an image file until it is below the requested size.
 * Returns the original file if compression fails.
 */
export async function compressImageIfNeeded(
  file: File,
  maxBytes: number = 10 * 1024 * 1024
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    return file;
  }
  if (file.size <= maxBytes) {
    return file;
  }

  try {
    const img = await loadImageElement(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const MAX_DIMENSION = 4096;

    const clampDimensions = () => {
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
    };

    clampDimensions();

    let quality = 0.92;
    const MIN_QUALITY = 0.4;
    const SCALE_STEP = 0.88;
    let blob: Blob | null = null;

    const renderToBlob = (w: number, h: number, q: number) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.width = w;
        canvas.height = h;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(new Error('Unable to create blob from canvas'));
              return;
            }
            resolve(result);
          },
          'image/jpeg',
          q
        );
      });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      blob = await renderToBlob(width, height, quality);
      if (blob.size <= maxBytes) {
        return blob;
      }

      if (quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.1);
      } else {
        width = Math.floor(width * SCALE_STEP);
        height = Math.floor(height * SCALE_STEP);
        if (width < 256 || height < 256) {
          break;
        }
      }
    }

    return blob || file;
  } catch {
    return file;
  }
}

