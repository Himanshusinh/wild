export type CrystalUpscalerEstimate = {
  inputWidth: number;
  inputHeight: number;
  scaleFactor: number;
  outputWidth: number;
  outputHeight: number;
  totalPixels: number;
  credits: number;
  userCostCents: number;
  baseCents: number;
  overchargeCents: number;
};

function clampInt(n: number, min: number, max: number): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

export function estimateCrystalUpscalerCredits(
  inputWidth: number,
  inputHeight: number,
  scaleFactorRaw: number = 2
): CrystalUpscalerEstimate | null {
  const inputW = clampInt(inputWidth, 1, 1_000_000);
  const inputH = clampInt(inputHeight, 1, 1_000_000);
  if (inputW <= 0 || inputH <= 0) return null;

  // Backend pricing clamps Crystal Upscaler scale_factor to [1..4]
  const scaleFactor = clampInt(scaleFactorRaw, 1, 4);

  const outputWidth = Math.max(1, Math.round(inputW * scaleFactor));
  const outputHeight = Math.max(1, Math.round(inputH * scaleFactor));
  const totalPixels = outputWidth * outputHeight;

  const baseCents = (() => {
    // Match credit sheet tiers (MP = million pixels)
    if (totalPixels <= 4_000_000) return 5;
    if (totalPixels <= 8_000_000) return 10;
    if (totalPixels <= 16_000_000) return 20;
    if (totalPixels <= 25_000_000) return 40;
    if (totalPixels <= 50_000_000) return 80;
    if (totalPixels <= 100_000_000) return 160;
    return 320;
  })();

  const overchargeCents = 1;
  const userCostCents = baseCents + overchargeCents;

  // Credit cost MUST match the sheet exactly (fixed credits per tier).
  const credits = (() => {
    if (totalPixels <= 4_000_000) return 120;
    if (totalPixels <= 8_000_000) return 220;
    if (totalPixels <= 16_000_000) return 420;
    if (totalPixels <= 25_000_000) return 820;
    if (totalPixels <= 50_000_000) return 1620;
    if (totalPixels <= 100_000_000) return 3220;
    return 6420;
  })();

  // Detailed debug logs to verify estimator matches backend.
  // eslint-disable-next-line no-console
  console.log('[credits][crystal-upscaler] estimate', {
    input: { w: inputW, h: inputH },
    scaleFactor,
    output: { w: outputWidth, h: outputHeight },
    totalPixels,
    totalMP: Math.round((totalPixels / 1_000_000) * 100) / 100,
    baseCents,
    overchargeCents,
    userCostCents,
    credits,
  });

  return {
    inputWidth: inputW,
    inputHeight: inputH,
    scaleFactor,
    outputWidth,
    outputHeight,
    totalPixels,
    credits,
    userCostCents,
    baseCents,
    overchargeCents,
  };
}
