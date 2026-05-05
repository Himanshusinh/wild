/** z-image-turbo: stay under 1MP, dimensions divisible by 16 */
export const convertFrameSizeToZTurboDimensions = (
  frameSize: string,
): { width: number; height: number } => {
  const MAX_PIXELS = 1000000;
  const MIN_DIMENSION = 64;
  const MAX_DIMENSION = 1440;
  const MULTIPLE_OF = 16;

  const parseAspectRatio = (
    ratio: string,
  ): { widthRatio: number; heightRatio: number } => {
    const parts = ratio.split(":");
    if (parts.length !== 2) return { widthRatio: 1, heightRatio: 1 };
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0)
      return { widthRatio: 1, heightRatio: 1 };
    return { widthRatio: w, heightRatio: h };
  };

  const { widthRatio, heightRatio } = parseAspectRatio(frameSize);
  const aspectRatio = widthRatio / heightRatio;

  let width: number;
  let height: number;

  if (aspectRatio > 1) {
    width = Math.min(1440, Math.floor(Math.sqrt(MAX_PIXELS * aspectRatio)));
    height = Math.round(width / aspectRatio);
  } else if (aspectRatio < 1) {
    height = Math.min(1440, Math.floor(Math.sqrt(MAX_PIXELS / aspectRatio)));
    width = Math.round(height * aspectRatio);
  } else {
    width = Math.min(1440, Math.floor(Math.sqrt(MAX_PIXELS)));
    height = width;
  }

  width = Math.round(width / MULTIPLE_OF) * MULTIPLE_OF;
  height = Math.round(height / MULTIPLE_OF) * MULTIPLE_OF;

  while (width * height >= MAX_PIXELS) {
    if (aspectRatio > 1) {
      width -= MULTIPLE_OF;
      height = Math.round(width / aspectRatio / MULTIPLE_OF) * MULTIPLE_OF;
    } else if (aspectRatio < 1) {
      height -= MULTIPLE_OF;
      width = Math.round((height * aspectRatio) / MULTIPLE_OF) * MULTIPLE_OF;
    } else {
      width -= MULTIPLE_OF;
      height = width;
    }
  }

  const clampToLimits = (value: number): number => {
    const rounded = Math.round(value / MULTIPLE_OF) * MULTIPLE_OF;
    return Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, rounded));
  };

  width = clampToLimits(width);
  height = clampToLimits(height);

  if (width * height >= MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / (width * height));
    width = Math.round((width * scale) / MULTIPLE_OF) * MULTIPLE_OF;
    height = Math.round((height * scale) / MULTIPLE_OF) * MULTIPLE_OF;
    width = Math.max(MIN_DIMENSION, width);
    height = Math.max(MIN_DIMENSION, height);
  }

  return { width, height };
};

/** flux-pro-1.1: fixed map + 32px clamp 256–1440 */
export const convertFrameSizeToFluxProDimensions = (
  frameSize: string,
): { width: number; height: number } => {
  const dimensionMap: { [key: string]: { width: number; height: number } } = {
    "1:1": { width: 1024, height: 1024 },
    "16:9": { width: 1024, height: 576 },
    "9:16": { width: 576, height: 1024 },
    "4:3": { width: 1024, height: 768 },
    "3:4": { width: 768, height: 1024 },
    "3:2": { width: 1024, height: 672 },
    "2:3": { width: 672, height: 1008 },
    "21:9": { width: 1024, height: 438 },
    "9:21": { width: 448, height: 1024 },
    "16:10": { width: 1024, height: 640 },
    "10:16": { width: 640, height: 1024 },
  };

  const dimensions = dimensionMap[frameSize] || { width: 1024, height: 1024 };

  const clampToLimits = (value: number): number => {
    const clamped = Math.max(
      256,
      Math.min(1440, Math.round(value / 32) * 32),
    );
    console.log(
      `Dimension ${value} clamped to ${clamped} (multiple of 32, within 256-1440 range)`,
    );
    return clamped;
  };

  const result = {
    width: clampToLimits(dimensions.width),
    height: clampToLimits(dimensions.height),
  };

  console.log(`Frame size ${frameSize} converted to dimensions:`, result);
  console.log(
    `API compliance check: width=${result.width} (${result.width % 32 === 0 ? "✓ multiple of 32" : "✗ not multiple of 32"}), height=${result.height} (${result.height % 32 === 0 ? "✓ multiple of 32" : "✗ not multiple of 32"})`,
  );
  console.log(
    `Range check: width=${result.width} (${result.width >= 256 && result.width <= 1440 ? "✓ in range 256-1440" : "✗ out of range"}), height=${result.height} (${result.height >= 256 && result.height <= 1440 ? "✓ in range 256-1440" : "✗ out of range"})`,
  );
  return result;
};
