import { creditDistributionData } from "./creditDistribution";

const SEEDANCE_2_USD_PER_1K_TOKENS = 0.014;
const SEEDANCE_2_FAST_USD_PER_1K_TOKENS = 0.0112;
const SEEDANCE_2_CREDITS_PER_USD = 4000 / 5.003;
const SEEDANCE_2_REFERENCE_USD_PER_SECOND_720P = 0.3024;
const SEEDANCE_2_FAST_REFERENCE_USD_PER_SECOND_720P = 0.2419;
const SEEDANCE_2_FAST_REFERENCE_VIDEO_INPUT_MULTIPLIER = 0.6;

type Seedance2AspectRatio =
  | "auto"
  | "21:9"
  | "16:9"
  | "4:3"
  | "1:1"
  | "3:4"
  | "9:16";

const normalizeSeedance2AspectRatio = (
  aspectRatio?: string,
): Seedance2AspectRatio => {
  const value = String(aspectRatio || "auto").toLowerCase();
  if (
    value === "21:9" ||
    value === "16:9" ||
    value === "4:3" ||
    value === "1:1" ||
    value === "3:4" ||
    value === "9:16"
  ) {
    return value;
  }
  return "auto";
};

const parseSeedance2DurationSeconds = (
  duration?: string | number,
  fallbackSeconds = 8,
): number => {
  if (duration == null || duration === "") return fallbackSeconds;
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return Math.min(15, Math.max(4, duration));
  }
  const text = String(duration).trim().toLowerCase();
  if (text === "auto") return fallbackSeconds;
  const parsed = parseFloat(text.replace(/s$/i, ""));
  if (!Number.isFinite(parsed)) return fallbackSeconds;
  return Math.min(15, Math.max(4, parsed));
};

export const getSeedance2EstimatedDimensions = (
  resolution?: string,
  aspectRatio?: string,
): {
  width: number;
  height: number;
  resolution: "480p" | "720p";
  aspectRatio: Seedance2AspectRatio;
} => {
  const normalizedResolution =
    String(resolution || "720p").toLowerCase() === "480p" ? "480p" : "720p";
  const normalizedAspectRatio = normalizeSeedance2AspectRatio(aspectRatio);

  const dims720: Record<
    Seedance2AspectRatio,
    { width: number; height: number }
  > = {
    auto: { width: 1280, height: 720 },
    "21:9": { width: 1680, height: 720 },
    "16:9": { width: 1280, height: 720 },
    "4:3": { width: 960, height: 720 },
    "1:1": { width: 720, height: 720 },
    "3:4": { width: 720, height: 960 },
    "9:16": { width: 720, height: 1280 },
  };

  const dims480: Record<
    Seedance2AspectRatio,
    { width: number; height: number }
  > = {
    auto: { width: 854, height: 480 },
    "21:9": { width: 1120, height: 480 },
    "16:9": { width: 854, height: 480 },
    "4:3": { width: 640, height: 480 },
    "1:1": { width: 480, height: 480 },
    "3:4": { width: 480, height: 640 },
    "9:16": { width: 480, height: 854 },
  };

  const source = normalizedResolution === "480p" ? dims480 : dims720;
  const dims = source[normalizedAspectRatio];

  return {
    ...dims,
    resolution: normalizedResolution,
    aspectRatio: normalizedAspectRatio,
  };
};

export const computeSeedance2Credits = (
  resolution?: string,
  duration?: string | number,
  aspectRatio?: string,
  usdPer1kTokens: number = SEEDANCE_2_USD_PER_1K_TOKENS,
): number => {
  const dims = getSeedance2EstimatedDimensions(resolution, aspectRatio);
  const seconds = parseSeedance2DurationSeconds(duration, 8);
  const tokens = (dims.width * dims.height * seconds * 24) / 1024;
  const usdCost = (tokens / 1000) * usdPer1kTokens;
  return Math.max(1, Math.ceil(usdCost * SEEDANCE_2_CREDITS_PER_USD));
};

export const computeSeedance2FastI2vCredits = (
  resolution?: string,
  duration?: string | number,
  aspectRatio?: string,
): number =>
  computeSeedance2Credits(
    resolution,
    duration,
    aspectRatio,
    SEEDANCE_2_FAST_USD_PER_1K_TOKENS,
  );

export const computeSeedance2FastT2vCredits = (
  resolution?: string,
  duration?: string | number,
  aspectRatio?: string,
): number =>
  computeSeedance2Credits(
    resolution,
    duration,
    aspectRatio,
    SEEDANCE_2_FAST_USD_PER_1K_TOKENS,
  );

const computeSeedance2ReferenceCreditsWithRate = (
  resolution?: string,
  duration?: string | number,
  aspectRatio?: string,
  inputVideoDurationSec: number = 0,
  hasReferenceVideoInput: boolean = false,
  baseRateUsdPerSecond720p: number = SEEDANCE_2_REFERENCE_USD_PER_SECOND_720P,
  usdPer1kTokens: number = SEEDANCE_2_USD_PER_1K_TOKENS,
): number => {
  const dims = getSeedance2EstimatedDimensions(resolution, aspectRatio);
  const outputDurationSec = parseSeedance2DurationSeconds(duration, 8);
  const safeInputVideoDurationSec = Math.max(
    0,
    Number(inputVideoDurationSec) || 0,
  );
  const tokens =
    (dims.width *
      dims.height *
      (safeInputVideoDurationSec + outputDurationSec) *
      24) /
    1024;
  const tokenUsdCost = (tokens / 1000) * usdPer1kTokens;
  const outputPixelRatio = (dims.width * dims.height) / (1280 * 720);
  const baseVideoUsdCost = outputDurationSec * baseRateUsdPerSecond720p * outputPixelRatio;
  const subtotalUsd = baseVideoUsdCost + tokenUsdCost;
  const shouldApplyReferenceVideoMultiplier =
    hasReferenceVideoInput || safeInputVideoDurationSec > 0;
  const totalUsd =
    shouldApplyReferenceVideoMultiplier
      ? subtotalUsd * SEEDANCE_2_FAST_REFERENCE_VIDEO_INPUT_MULTIPLIER
      : subtotalUsd;

  return Math.max(1, Math.ceil(totalUsd * SEEDANCE_2_CREDITS_PER_USD));
};

export const computeSeedance2ReferenceCredits = (
  resolution?: string,
  duration?: string | number,
  aspectRatio?: string,
  inputVideoDurationSec: number = 0,
  hasReferenceVideoInput: boolean = false,
): number =>
  computeSeedance2ReferenceCreditsWithRate(
    resolution,
    duration,
    aspectRatio,
    inputVideoDurationSec,
    hasReferenceVideoInput,
    SEEDANCE_2_REFERENCE_USD_PER_SECOND_720P,
    SEEDANCE_2_USD_PER_1K_TOKENS,
  );

export const computeSeedance2FastReferenceCredits = (
  resolution?: string,
  duration?: string | number,
  aspectRatio?: string,
  inputVideoDurationSec: number = 0,
  hasReferenceVideoInput: boolean = false,
): number =>
  computeSeedance2ReferenceCreditsWithRate(
    resolution,
    duration,
    aspectRatio,
    inputVideoDurationSec,
    hasReferenceVideoInput,
    SEEDANCE_2_FAST_REFERENCE_USD_PER_SECOND_720P,
    SEEDANCE_2_FAST_USD_PER_1K_TOKENS,
  );

// Direct mapping between dropdown model values and their credit costs
export const MODEL_CREDITS_MAPPING: Record<string, number> = {
  // Image Generation Models
  "flux-kontext-pro": 32, // FLUX.1 Kontext [pro]
  "flux-kontext-max": 64, // FLUX.1 Kontext [max]
  "flux-pro-1.1": 110, // FLUX 1.1 [pro]
  "flux-pro-1.1-ultra": 140, // FLUX 1.1 [pro] Ultra
  "flux-pro": 130, // FLUX.1 [pro]
  "flux-dev": 90, // FLUX.1 [dev]
  gen4_image: 180, // Runway Gen 4 Image 720p (updated to 180 credits)
  gen4_image_1080p: 180, // Runway Gen 4 Image 1080p
  gen4_image_turbo: 60, // Runway Gen 4 Image Turbo
  "minimax-image-01": 3, // MiniMax Image 01
  "gemini-25-flash-image": 32, // Google nano banana (T2I)
  "gemini-25-flash-image-i2i": 32, // Google nano banana (I2I)
  "gpt-5-nano": 1, // GPT-5 Nano (Assistant)
  "google/nano-banana-2-0.5k": 48,
  "google/nano-banana-2-1k": 64,
  "google/nano-banana-2-2k": 96,
  "google/nano-banana-2-4k": 128,
  "google/nano-banana-pro": 120, // Google nano banana pro (default 1K/2K - 120 credits, 4K - 240 credits)
  "seedream-v4": 80,
  "seedream-4.5": 32, // Bytedance Seedream-4.5
  "seedream-5-lite": 28, // Seedream 5 Lite
  "recraft-ai/recraft-v4": 32,
  "replicate/recraft-ai/recraft-v4": 32,
  "recraft-v4": 32,
  "ideogram-ai/ideogram-v3": 80,
  "ideogram-ai/ideogram-v3-quality": 200,
  "ideogram-3-turbo": 80, // Ideogram 3 Turbo
  "qwen-image-edit": 24, // Legacy alias (keep for backward compatibility)
  "qwen-image-edit-2511": 24, // Replicate Qwen Image Edit 2511
  "qwen-image-edit-2512": 60, // Replicate Qwen Image Edit 2512 (flat 60 credits)
  // Qwen Image (non-edit) variants
  "qwen-image-2511": 24,
  "qwen/qwen-image-2511": 24,
  "replicate/qwen/qwen-image-2511": 24,
  // Backend/provider may return provider-prefixed or non-edit 2512 identifiers; keep them aligned to 60 credits.
  "qwen-image-2512": 60,
  "qwen/qwen-image-2512": 60,
  "replicate/qwen/qwen-image-2512": 60,
  "qwen/qwen-image-edit-2512": 60,
  "replicate/qwen/qwen-image-edit-2512": 60,
  "qwen/qwen-image-2": 28,
  "qwen/qwen-image-2-pro": 60,
  // Imagen 4 family (FAL/Google)
  "imagen-4-ultra": 48,
  "imagen-4": 32,
  "imagen-4-fast": 16,
  "flux-2-pro": 24, // Default to 1080p T2I, resolved based on resolution/input mode
  "flux-2-pro-1080p": 24, // FLUX.2 [pro] 1080p
  "flux-2-pro-2k": 56, // FLUX.2 [pro] 2K
  "z-image-turbo": 4, // Z Image Turbo
  "leonardoai/lucid-origin": 173,
  "leonardoai/phoenix-1.0": 170,
  // Google Nano Banana (used by erase/replace in Edit Image)
  google_nano_banana: 32,
  // Z-Image Turbo: Free (0 credits) for launch offer
  "new-turbo-model": 4, // z-image-turbo
  // WILDMINDIMAGE: Free (0 credits)
  wildmindimage: 0,
  // Product Generation Models
  "flux-krea": 130, // Similar to FLUX.1 [pro]
  "flux-kontext-dev": 90, // Similar to FLUX.1 [dev]

  // Video Generation Models - Default durations
  gen4_turbo: 520, // Gen-4 Turbo 5s (default)
  gen3a_turbo: 200, // Gen-3a Turbo 5s (default)
  gen4_aleph: 360, // Gen-4 Aleph 1s (creditDistribution shows 1s variant)
  "minimax-hailuo-01": 220, // Minimax-Hailuo-01 512P 6s
  "MiniMax-Hailuo-02": 320, // Minimax-Hailuo-02 512P 6s (legacy default)
  "T2V-01-Director": 980, // T2V-01-Director
  "I2V-01-Director": 980, // I2V-01-Director
  "S2V-01": 1420, // S2V-01

  // Music Generation Models
  "minimax-music-2": 80, // MiniMax Music 2 (60 credits per creditDistribution.ts)
  "minimax-music-2 10min": 160, // MinMax Music 2.0 5minutes (80 credits per creditDistribution.ts)
  "elevenlabs-tts": 220, // Elevenlabs Eleven v3 TTS 1000 Characters (220 credits per creditDistribution.ts - default to 1000 chars)
  "elevenlabs-tts-1000": 220, // Elevenlabs Eleven v3 TTS 1000 Characters (220 credits per creditDistribution.ts)
  "elevenlabs-tts-2000": 420, // Elevenlabs Eleven v3 TTS 2000 Characters (420 credits per creditDistribution.ts)
  "chatterbox-multilingual": 70, // Chatter Box Multilingual 1000 Characters (70 credits per creditDistribution.ts)
  "chatterbox-multilingual-1000": 70, // Chatter Box Multilingual 1000 Characters (70 credits per creditDistribution.ts)
  "maya-tts": 6, // Maya TTS (6 credits per second - actual cost calculated dynamically based on audio duration)
  "elevenlabs-dialogue": 220, // Elevenlabs Eleven v3 TTD 1000 Characters (220 credits per creditDistribution.ts - default to 1000 chars, same as TTS)
  "elevenlabs-dialogue-1000": 220, // Elevenlabs Eleven v3 TTD 1000 Characters (220 credits per creditDistribution.ts)
  "elevenlabs-dialogue-2000": 420, // Elevenlabs Eleven v3 TTD 2000 Characters (420 credits per creditDistribution.ts)
  "elevenlabs-sfx": 6, // Elevenlabs Sound-Effects v2 1s (24 credits per creditDistribution.ts)

  // Ad Generation Models (same as image generation)
  "flux-kontext-pro-ad": 110,
  "flux-kontext-max-ad": 190,

  // Video models with duration and resolution variants
  // Minimax-Hailuo-02 variants
  "MiniMax-Hailuo-02-512P-6s": 220,
  "MiniMax-Hailuo-02-512P-10s": 320,
  "MiniMax-Hailuo-02-768P-6s": 580,
  "MiniMax-Hailuo-02-768P-10s": 1140,
  "MiniMax-Hailuo-02-1080P-6s": 1000,

  // Minimax-Hailuo-2.3 Fast variants
  "MiniMax-Hailuo-2.3-Fast-768P-6s": 264,
  "MiniMax-Hailuo-2.3-Fast-768P-10s": 256,
  "MiniMax-Hailuo-2.3-Fast-1080P-6s": 152,

  // Minimax-Hailuo-2.3 Standard variants
  "MiniMax-Hailuo-2.3-768P-6s": 224,
  "MiniMax-Hailuo-2.3-768P-10s": 448,
  "MiniMax-Hailuo-2.3-1080P-6s": 392,

  // Gen-4 Turbo variants
  "gen4_turbo-5s": 520,
  "gen4_turbo-10s": 1020,

  // Gen-3a Turbo variants
  "gen3a_turbo-5s": 200,
  "gen3a_turbo-10s": 400,

  // Veo3 models
  "veo3-t2v-4s": 3260,
  "veo3-t2v-6s": 4860,
  "veo3-t2v-8s": 6460,
  "veo3-i2v-8s": 6460,
  "veo3-fast-t2v-4s": 1260,
  "veo3-fast-t2v-6s": 1860,
  "veo3-fast-t2v-8s": 2460,
  "veo3-fast-i2v-8s": 2460,
  "RW-veo3-8s": 6460,

  // Veo 3.1 models (AUDIO ON - default)
  "veo3.1-t2v-4s": 1280,
  "veo3.1-t2v-6s": 1923,
  "veo3.1-t2v-8s": 2560,
  "veo3.1-i2v-4s": 1280,
  "veo3.1-i2v-6s": 1923,
  "veo3.1-i2v-8s": 2560,
  "veo3.1-fast-t2v-4s": 480,
  "veo3.1-fast-t2v-6s": 720,
  "veo3.1-fast-t2v-8s": 960,
  "veo3.1-fast-i2v-4s": 480,
  "veo3.1-fast-i2v-6s": 720,
  "veo3.1-fast-i2v-8s": 960,
  // Veo 3.1 models (AUDIO OFF)
  "veo3.1-t2v-4s-audio-off": 640,
  "veo3.1-t2v-6s-audio-off": 960,
  "veo3.1-t2v-8s-audio-off": 1280,
  "veo3.1-i2v-4s-audio-off": 640,
  "veo3.1-i2v-6s-audio-off": 960,
  "veo3.1-i2v-8s-audio-off": 1280,
  "veo3.1-fast-t2v-4s-audio-off": 320,
  "veo3.1-fast-t2v-6s-audio-off": 480,
  "veo3.1-fast-t2v-8s-audio-off": 640,
  "veo3.1-fast-i2v-4s-audio-off": 320,
  "veo3.1-fast-i2v-6s-audio-off": 480,
  "veo3.1-fast-i2v-8s-audio-off": 640,
  "veo3.1-lite-t2v-4s-720p": 160,
  "veo3.1-lite-t2v-6s-720p": 240,
  "veo3.1-lite-t2v-8s-720p": 320,
  "veo3.1-lite-t2v-4s-1080p": 256,
  "veo3.1-lite-t2v-6s-1080p": 384,
  "veo3.1-lite-t2v-8s-1080p": 512,
  "veo3.1-lite-i2v-4s-720p": 160,
  "veo3.1-lite-i2v-6s-720p": 240,
  "veo3.1-lite-i2v-8s-720p": 320,
  "veo3.1-lite-i2v-4s-1080p": 256,
  "veo3.1-lite-i2v-6s-1080p": 384,
  "veo3.1-lite-i2v-8s-1080p": 512,
  "veo3.1-lite-flf2v-8s-720p": 320,
  "veo3.1-lite-flf2v-8s-1080p": 512,

  // WAN 2.5 Standard T2V
  "wan-2.5-t2v-5s-480p": 200,
  "wan-2.5-t2v-5s-720p": 400,
  "wan-2.5-t2v-5s-1080p": 600,
  "wan-2.5-t2v-10s-480p": 400,
  "wan-2.5-t2v-10s-720p": 800,
  "wan-2.5-t2v-10s-1080p": 1200,

  // WAN 2.5 Standard I2V
  "wan-2.5-i2v-5s-480p": 200,
  "wan-2.5-i2v-5s-720p": 400,
  "wan-2.5-i2v-5s-1080p": 600,
  "wan-2.5-i2v-10s-480p": 400,
  "wan-2.5-i2v-10s-720p": 800,
  "wan-2.5-i2v-10s-1080p": 1200,

  // WAN 2.5 Fast T2V
  "wan-2.5-fast-t2v-5s-720p": 272,
  "wan-2.5-fast-t2v-5s-1080p": 408,
  "wan-2.5-fast-t2v-10s-720p": 544,
  "wan-2.5-fast-t2v-10s-1080p": 816,

  // WAN 2.5 Fast I2V
  "wan-2.5-fast-i2v-5s-720p": 272,
  "wan-2.5-fast-i2v-5s-1080p": 408,
  "wan-2.5-fast-i2v-10s-720p": 544,
  "wan-2.5-fast-i2v-10s-1080p": 816,

  // Kling 2.6 Pro credit SKUs (FAL, audio on/off variants)
  "kling-2.6-pro-t2v-i2v-5s-audio-off": 280,
  "kling-2.6-pro-t2v-i2v-5s-audio-on": 560,
  "kling-2.6-pro-t2v-i2v-10s-audio-off": 560,
  "kling-2.6-pro-t2v-i2v-10s-audio-on": 1120,
  // Kling credit SKUs (map to distribution names)
  "kling-v2.5-turbo-pro-t2v-5s": 280,
  "kling-v2.5-turbo-pro-t2v-10s": 560,
  "kling-v2.5-turbo-pro-i2v-5s": 280,
  "kling-v2.5-turbo-pro-i2v-10s": 560,
  "kling-v2.1-master-t2v-5s": 2920,
  "kling-v2.1-master-t2v-10s": 5720,
  "kling-v2.1-master-i2v-5s": 2920,
  "kling-v2.1-master-i2v-10s": 5720,
  // Kling 2.1 (non-master) – supports only I2V; align T2V keys to I2V pricing to avoid mismatches
  "kling-v2.1-t2v-5s-720p": 560,
  "kling-v2.1-t2v-5s-1080p": 960,
  "kling-v2.1-t2v-10s-720p": 1060,
  "kling-v2.1-t2v-10s-1080p": 1860,
  "kling-v2.1-i2v-5s-720p": 560,
  "kling-v2.1-i2v-5s-1080p": 960,
  "kling-v2.1-i2v-10s-720p": 1060,
  "kling-v2.1-i2v-10s-1080p": 1860,

  // Seedance 1.0 Pro T2V/I2V (duration mapped: 2-6s -> 5s, 7-12s -> 10s)
  "seedance-1.0-pro-t2v-5s-480p": 120,
  "seedance-1.0-pro-t2v-5s-720p": 240,
  "seedance-1.0-pro-t2v-5s-1080p": 600,
  "seedance-1.0-pro-t2v-10s-480p": 240,
  "seedance-1.0-pro-t2v-10s-720p": 480,
  "seedance-1.0-pro-t2v-10s-1080p": 1200,
  "seedance-1.0-pro-i2v-5s-480p": 120,
  "seedance-1.0-pro-i2v-5s-720p": 240,
  "seedance-1.0-pro-i2v-5s-1080p": 600,
  "seedance-1.0-pro-i2v-10s-480p": 240,
  "seedance-1.0-pro-i2v-10s-720p": 480,
  "seedance-1.0-pro-i2v-10s-1080p": 1200,

  // Seedance 1.0 Lite T2V/I2V (duration mapped: 2-6s -> 5s, 7-12s -> 10s)
  "seedance-1.0-lite-t2v-5s-480p": 72,
  "seedance-1.0-lite-t2v-5s-720p": 144,
  "seedance-1.0-lite-t2v-5s-1080p": 288,
  "seedance-1.0-lite-t2v-10s-480p": 144,
  "seedance-1.0-lite-t2v-10s-720p": 288,
  "seedance-1.0-lite-t2v-10s-1080p": 576,
  "seedance-1.0-lite-i2v-5s-480p": 72,
  "seedance-1.0-lite-i2v-5s-720p": 144,
  "seedance-1.0-lite-i2v-5s-1080p": 288,
  "seedance-1.0-lite-i2v-10s-480p": 144,
  "seedance-1.0-lite-i2v-10s-720p": 288,
  "seedance-1.0-lite-i2v-10s-1080p": 576,

  // Seedance 1.0 Pro Fast T2V/I2V (duration mapped: 2-6s -> 5s, 7-12s -> 10s)
  "seedance-1.0-pro-fast-t2v-5s-480p": 60,
  "seedance-1.0-pro-fast-t2v-5s-720p": 100,
  "seedance-1.0-pro-fast-t2v-5s-1080p": 240,
  "seedance-1.0-pro-fast-t2v-10s-480p": 120,
  "seedance-1.0-pro-fast-t2v-10s-720p": 200,
  "seedance-1.0-pro-fast-t2v-10s-1080p": 480,
  "seedance-1.0-pro-fast-i2v-5s-480p": 60,
  "seedance-1.0-pro-fast-i2v-5s-720p": 100,
  "seedance-1.0-pro-fast-i2v-5s-1080p": 240,
  "seedance-1.0-pro-fast-i2v-10s-480p": 120,
  "seedance-1.0-pro-fast-i2v-10s-720p": 200,
  "seedance-1.0-pro-fast-i2v-10s-1080p": 480,

  // PixVerse 5 T2V/I2V (duration: 5s or 8s)
  "pixverse-v5-t2v-5s-360p": 240,
  "pixverse-v5-t2v-5s-540p": 240,
  "pixverse-v5-t2v-5s-720p": 320,
  "pixverse-v5-t2v-5s-1080p": 640,
  "pixverse-v5-t2v-8s-360p": 480,
  "pixverse-v5-t2v-8s-540p": 480,
  "pixverse-v5-t2v-8s-720p": 640,
  "pixverse-v5-t2v-8s-1080p": 1280,
  "pixverse-v5-i2v-5s-360p": 240,
  "pixverse-v5-i2v-5s-540p": 240,
  "pixverse-v5-i2v-5s-720p": 320,
  "pixverse-v5-i2v-5s-1080p": 640,
  "pixverse-v5-i2v-8s-360p": 480,
  "pixverse-v5-i2v-8s-540p": 480,
  "pixverse-v5-i2v-8s-720p": 640,
  "pixverse-v5-i2v-8s-1080p": 1280,

  // Sora 2 Standard (T2V/I2V)
  "sora2-t2v-4s": 320,
  "sora2-t2v-8s": 640,
  "sora2-t2v-12s": 960,
  "sora2-i2v-4s": 320,
  "sora2-i2v-8s": 640,
  "sora2-i2v-12s": 960,

  // Sora 2 Pro (T2V/I2V) - 720p
  "sora2-pro-t2v-4s-720p": 960,
  "sora2-pro-t2v-8s-720p": 1923,
  "sora2-pro-t2v-12s-720p": 2878,
  "sora2-pro-i2v-4s-720p": 960,
  "sora2-pro-i2v-8s-720p": 1923,
  "sora2-pro-i2v-12s-720p": 2878,

  // Sora 2 Pro (T2V/I2V) - 1080p
  "sora2-pro-t2v-4s-1080p": 1600,
  "sora2-pro-t2v-8s-1080p": 3200,
  "sora2-pro-t2v-12s-1080p": 4811,
  "sora2-pro-i2v-4s-1080p": 1600,
  "sora2-pro-i2v-8s-1080p": 3200,
  "sora2-pro-i2v-12s-1080p": 4811,

  // SeedVR2 models (duration and resolution variants)
  "seedvr2-5s-720p": 400,
  "seedvr2-5s-1080p": 1200,
  "seedvr2-5s-2k": 2395,
  "seedvr2-10s-720p": 800,
  "seedvr2-10s-1080p": 2395,
  "seedvr2-10s-2k": 4811,

  // Kling o1 (FAL first/last frame)
  "kling-o1": 336,
  "kling-o1-5s": 336,
  "kling-o1-10s": 671,

  // Image Utility Models
  "fal-image2svg": 4, // Image to SVG
  "fal-recraft-vectorize": 8, // Recraft Vectorize
  "fal-outpaint": 70, // fal-ai/outpaint
  "fal-bria-genfill": 32, // fal-ai/bria/genfill
  "fal-topaz-upscale-24mp": 64, // fal-ai/topaz/upscale/image 24MP
  "fal-topaz-upscale-48mp": 128, // fal-ai/topaz/upscale/image 48MP
  "fal-topaz-upscale-96mp": 256, // fal-ai/topaz/upscale/image 96MP
  "fal-topaz-upscale-512mp": 1087, // fal-ai/topaz/upscale/image 512MP
  "replicate-magic-image-refiner": 84, // replicate/fermatresearch/magic-image-refiner
  "replicate-clarity-upscaler": 62, // replicate/philz1337x/clarity-upscaler
  // Background removal (Replicate) - align with creditDistribution (10 credits)
  "replicate-lucataco-remove-bg": 1, // Lucataco/remove-bg
  "replicate-851-labs-remove-bg": 1, // 851-labs/background-remover
  "replicate-bria-expand-image": 100, // replicate/bria/expand-image
  "replicate-real-esrgan": 32, // replicate/nightmareai/real-esrgan (32.4 rounded)
  "replicate-swin2sr": 43, // replicate/mv-lab/swin2sr
  "prunaai/p-image": 25, // P-Image (Replicate)
  "prunaai/p-image-edit": 25, // P-Image-Edit (I2I only, Replicate)
  // Crystal Upscaler variants
  "replicate-crystal-upscaler-1080p": 40,
  "replicate-crystal-upscaler-1440p": 80,
  "replicate-crystal-upscaler-2160p": 160,
  "replicate-crystal-upscaler-6k": 320,
  "replicate-crystal-upscaler-8k": 640,
  "replicate-crystal-upscaler-12k": 1280,

  // GPT Image 1.5 quality variants
  "gpt-image-1.5-auto": 109,
  "gpt-image-1.5-low": 11,
  "gpt-image-1.5-medium": 40,
  "gpt-image-1.5-high": 109,
};

// Function to get credit cost for a model
export const getCreditsForModel = (
  modelValue: string,
  duration?: string,
  resolution?: string,
  generateAudio?: boolean,
  uploadedImages?: any[],
  quality?: string,
  aspectRatio?: string,
  inputVideoDurationSec?: number,
  hasReferenceVideoInput?: boolean,
): number | null => {
  if (modelValue === "seedance-2.0-t2v") {
    return computeSeedance2Credits(resolution, duration, aspectRatio);
  }
  if (
    modelValue === "seedance-2.0-fast" ||
    modelValue === "seedance-2.0-fast-t2v" ||
    modelValue === "seedance-2.0-fast-i2v"
  ) {
    return computeSeedance2FastI2vCredits(resolution, duration, aspectRatio);
  }
  if (modelValue === "seedance-2.0-fast-r2v") {
    return computeSeedance2FastReferenceCredits(
      resolution,
      duration,
      aspectRatio,
      inputVideoDurationSec,
      Boolean(hasReferenceVideoInput),
    );
  }
  if (modelValue === "seedance-2.0-r2v") {
    return computeSeedance2ReferenceCredits(
      resolution,
      duration,
      aspectRatio,
      inputVideoDurationSec,
      Boolean(hasReferenceVideoInput),
    );
  }

  // Handle special cases for video models with duration and resolution
  if (modelValue === "MiniMax-Hailuo-02" && duration && resolution) {
    const durationNum = parseInt(duration.replace("s", ""));
    const resolutionP = resolution.replace("P", "P");
    const key = `MiniMax-Hailuo-02-${resolutionP}-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // MiniMax-Hailuo-2.3 Standard and Fast
  if (
    (modelValue === "MiniMax-Hailuo-2.3" ||
      modelValue === "MiniMax-Hailuo-2.3-Fast") &&
    duration &&
    resolution
  ) {
    const durationNum = parseInt(duration.replace("s", ""));
    const resolutionP = resolution.replace("P", "P");
    const fastPart = modelValue === "MiniMax-Hailuo-2.3-Fast" ? "Fast-" : "";
    const key = `MiniMax-Hailuo-2.3-${fastPart}${resolutionP}-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  if (modelValue === "gen4_turbo" && duration) {
    const durationNum = parseInt(duration.replace("s", ""));
    const key = `gen4_turbo-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  if (modelValue === "gen3a_turbo" && duration) {
    const durationNum = parseInt(duration.replace("s", ""));
    const key = `gen3a_turbo-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle veo3.1 models (check before veo3)
  if (modelValue.includes("veo3.1")) {
    if (modelValue.includes("veo3.1-lite")) {
      if (
        modelValue.includes("flf2v") ||
        modelValue.includes("first-last") ||
        modelValue.includes("first_last")
      ) {
        const res = String(resolution || "720p")
          .toLowerCase()
          .includes("1080")
          ? "1080p"
          : "720p";
        const key = `veo3.1-lite-flf2v-8s-${res}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      }

      const isI2V = modelValue.includes("i2v");
      const mode = isI2V ? "i2v" : "t2v";
      const res = String(resolution || "720p")
        .toLowerCase()
        .includes("1080")
        ? "1080p"
        : "720p";
      const dur =
        duration === "4s" || duration === "6s" || duration === "8s"
          ? duration
          : "8s";
      const key = `veo3.1-lite-${mode}-${dur}-${res}`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }

    const isFast = modelValue.includes("fast");
    const isI2V =
      modelValue.includes("i2v") ||
      modelValue.includes("first-last-frame-to-video");
    const modelType = isI2V ? "i2v" : "t2v";
    const audioSuffix = generateAudio === false ? "-audio-off" : "";

    if (isFast) {
      if (duration === "4s") {
        const key = `veo3.1-fast-${modelType}-4s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === "6s") {
        const key = `veo3.1-fast-${modelType}-6s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === "8s") {
        const key = `veo3.1-fast-${modelType}-8s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      }
    } else {
      if (duration === "4s") {
        const key = `veo3.1-${modelType}-4s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === "6s") {
        const key = `veo3.1-${modelType}-6s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === "8s") {
        const key = `veo3.1-${modelType}-8s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      }
    }
  }

  // Handle veo3 models (check after veo3.1 to avoid conflicts)
  if (modelValue.includes("veo3") && !modelValue.includes("veo3.1")) {
    if (modelValue.includes("fast")) {
      if (duration === "4s") return MODEL_CREDITS_MAPPING["veo3-fast-t2v-4s"];
      else if (duration === "6s")
        return MODEL_CREDITS_MAPPING["veo3-fast-t2v-6s"];
      else if (duration === "8s")
        return MODEL_CREDITS_MAPPING[
          modelValue.includes("i2v") ? "veo3-fast-i2v-8s" : "veo3-fast-t2v-8s"
        ];
    } else {
      if (duration === "4s") return MODEL_CREDITS_MAPPING["veo3-t2v-4s"];
      else if (duration === "6s") return MODEL_CREDITS_MAPPING["veo3-t2v-6s"];
      else if (duration === "8s")
        return MODEL_CREDITS_MAPPING[
          modelValue.includes("i2v") ? "veo3-i2v-8s" : "veo3-t2v-8s"
        ];
    }
  }

  // Handle WAN 2.5 models
  if (modelValue.includes("wan-2.5")) {
    const isFast = modelValue.includes("fast");
    const isI2V = modelValue.includes("i2v");
    const modelType = isI2V ? "i2v" : "t2v";
    const speedPrefix = isFast ? "fast-" : "";

    // Map resolution to our format
    let resolutionKey = "";
    if (resolution?.includes("480")) resolutionKey = "480p";
    else if (resolution?.includes("720")) resolutionKey = "720p";
    else if (resolution?.includes("1080")) resolutionKey = "1080p";

    // Map duration to our format
    const durationNum = duration ? parseInt(duration.replace("s", "")) : 5;

    const key = `wan-2.5-${speedPrefix}${modelType}-${durationNum}s-${resolutionKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle Kling models
  if (modelValue.startsWith("kling")) {
    if (modelValue === "kling-v3-standard" || modelValue === "kling-v3-pro") {
      const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
      const durationSeconds = Number.isFinite(d)
        ? Math.min(15, Math.max(3, d))
        : 5;
      const isPro = modelValue === "kling-v3-pro";
      const creditsPerSecond = isPro
        ? generateAudio !== false
          ? 403 / 3
          : 269 / 3
        : generateAudio !== false
          ? 302 / 3
          : 67;
      return Math.ceil(durationSeconds * creditsPerSecond);
    }
    // Special case: kling-o1 is a simple FAL model with only duration-based pricing (5s / 10s)
    if (modelValue === "kling-o1") {
      const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
      const key = `kling-o1-${d >= 10 ? "10s" : "5s"}`;
      return (
        MODEL_CREDITS_MAPPING[key] || MODEL_CREDITS_MAPPING["kling-o1"] || null
      );
    }
    // Kling 2.6 Pro: duration and audio-based
    if (modelValue === "kling-2.6-pro") {
      const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
      const hasAudio = generateAudio !== false; // Default to true
      const audioSuffix = hasAudio ? "-audio-on" : "-audio-off";
      // Use unified T2V/I2V key format to match creditDistribution.ts
      const key = `kling-2.6-pro-t2v-i2v-${d}s${audioSuffix}`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
    // v2.5 Turbo Pro: only duration matters
    if (modelValue.includes("v2.5")) {
      const isI2V = modelValue.includes("i2v");
      const kind = isI2V ? "i2v" : "t2v";
      const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
      const key = `kling-v2.5-turbo-pro-${kind}-${d}s`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
    // v2.1: duration and resolution
    const isI2V = modelValue.includes("i2v");
    const kind = isI2V ? "i2v" : "t2v";
    const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
    const res = (resolution || "").toLowerCase().includes("1080")
      ? "1080p"
      : "720p";
    const master = modelValue.includes("master");
    if (master) {
      const key = `kling-v2.1-master-${kind}-${d}s`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
    const key = `kling-v2.1-${kind}-${d}s-${res}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  const lowerModelValue = String(modelValue || "").toLowerCase();
  if (
    lowerModelValue.includes("fal-ai/kling-video/v3/standard/") ||
    lowerModelValue.includes("kling 3 standard")
  ) {
    const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
    const durationSeconds = Number.isFinite(d)
      ? Math.min(15, Math.max(3, d))
      : 5;
    const creditsPerSecond = generateAudio !== false ? 302 / 3 : 67;
    return Math.ceil(durationSeconds * creditsPerSecond);
  }
  if (
    lowerModelValue.includes("fal-ai/kling-video/v3/pro/") ||
    lowerModelValue.includes("kling 3 pro")
  ) {
    const d = duration ? parseInt(String(duration).replace("s", "")) : 5;
    const durationSeconds = Number.isFinite(d)
      ? Math.min(15, Math.max(3, d))
      : 5;
    const creditsPerSecond = generateAudio !== false ? 403 / 3 : 269 / 3;
    return Math.ceil(durationSeconds * creditsPerSecond);
  }

  // Handle Seedance models
  if (modelValue.includes("seedance")) {
    // Seedance 1.5: priced by exact duration (2-12s) and audio on/off.
    // Source of truth is creditDistributionData rows like:
    // "Seedance 1.5 T2V/I2V Audio On 2s" / "Seedance 1.5 T2V/I2V Audio Off 2s".
    if (modelValue.includes("seedance-1.5")) {
      const dRaw = duration ? parseInt(String(duration).replace("s", "")) : 5;
      const d = Math.max(2, Math.min(12, Math.round(dRaw)));
      // Backend defaults generate_audio to false if omitted, so default to Audio Off on frontend too.
      const hasAudio = generateAudio === true;
      const audioLabel = hasAudio ? "Audio On" : "Audio Off";
      const modelName = `Seedance 1.5 T2V/I2V ${audioLabel} ${d}s`;
      const row = creditDistributionData.find(
        (m: any) => m?.modelName === modelName,
      );
      const credits = row?.creditsPerGeneration;
      return typeof credits === "number" ? credits : null;
    }

    const isI2V = modelValue.includes("i2v");
    const modelType = isI2V ? "i2v" : "t2v";
    const isProFast = modelValue.includes("pro-fast");
    const tier = modelValue.includes("lite")
      ? "lite"
      : isProFast
        ? "pro-fast"
        : "pro";

    // Map resolution
    let resolutionKey = "";
    if (resolution?.includes("480")) resolutionKey = "480p";
    else if (resolution?.includes("720")) resolutionKey = "720p";
    else if (resolution?.includes("1080")) resolutionKey = "1080p";

    // Map duration: 2-6s -> 5s, 7-12s -> 10s for pricing
    const durationNum = duration
      ? parseInt(String(duration).replace("s", ""))
      : 5;
    const durForPricing =
      durationNum >= 2 && durationNum <= 6
        ? 5
        : durationNum >= 7 && durationNum <= 12
          ? 10
          : 5;

    const key = `seedance-1.0-${tier}-${modelType}-${durForPricing}s-${resolutionKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // PixVerse V6 T2V / I2V (FAL) — same product table; I2V allows 1–15s API but credits use ≥5s tier
  if (modelValue === "pixverse-v6-t2v" || modelValue === "pixverse-v6-i2v") {
    const raw = duration
      ? parseInt(String(duration).replace(/s$/i, ""), 10)
      : 5;
    const d = Math.min(15, Math.max(5, Number.isFinite(raw) ? raw : 5));
    const steps = d - 5;
    const res = String(resolution || "720p").toLowerCase();
    const withAudio = generateAudio === true;
    if (res.includes("360"))
      return withAudio ? 140 + steps * 28 : 100 + steps * 20;
    if (res.includes("540"))
      return withAudio ? 180 + steps * 36 : 140 + steps * 28;
    if (res.includes("1080"))
      return withAudio ? 460 + steps * 92 : 360 + steps * 72;
    return withAudio ? 240 + steps * 48 : 180 + steps * 36;
  }

  // PixVerse V5 (Replicate) T2V / I2V
  if (
    modelValue === "pixverse-v5-t2v" ||
    modelValue === "pixverse-v5-i2v"
  ) {
    const isI2V = modelValue.includes("i2v");
    const modelType = isI2V ? "i2v" : "t2v";

    let qualityKey = "";
    if (resolution?.includes("360")) qualityKey = "360p";
    else if (resolution?.includes("540")) qualityKey = "540p";
    else if (resolution?.includes("720")) qualityKey = "720p";
    else if (resolution?.includes("1080")) qualityKey = "1080p";
    else qualityKey = "720p";

    const durationNum = duration
      ? parseInt(String(duration).replace("s", ""))
      : 5;
    const durForPricing =
      durationNum === 5 || durationNum === 8 ? durationNum : 5;

    const key = `pixverse-v5-${modelType}-${durForPricing}s-${qualityKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle LTX V2 models (Pro/Fast, T2V/I2V) with duration and resolution
  if (modelValue.includes("ltx2")) {
    const isPro = modelValue.includes("pro");
    const res = (resolution || "1080p").toLowerCase();
    const durNum = duration ? parseInt(String(duration).replace("s", "")) : 6;
    // Pricing table (credits) based on user's provided chart
    const table: Record<
      "pro" | "fast",
      Record<"1080p" | "1440p" | "2160p", Record<6 | 8 | 10, number>>
    > = {
      pro: {
        "1080p": { 6: 780, 8: 1020, 10: 1260 },
        "1440p": { 6: 1500, 8: 1980, 10: 2460 },
        "2160p": { 6: 2940, 8: 3900, 10: 4860 },
      },
      fast: {
        "1080p": { 6: 540, 8: 700, 10: 860 },
        "1440p": { 6: 1020, 8: 1340, 10: 1660 },
        "2160p": { 6: 1980, 8: 2620, 10: 3260 },
      },
    };
    const tier: "pro" | "fast" = isPro ? "pro" : "fast";
    const resKey = (
      res.includes("1440")
        ? "1440p"
        : res.includes("2160") || res.includes("4k")
          ? "2160p"
          : "1080p"
    ) as "1080p" | "1440p" | "2160p";
    const d: 6 | 8 | 10 = durNum === 8 ? 8 : durNum === 10 ? 10 : 6;
    const cost = table[tier][resKey][d];
    return cost || null;
  }

  // Handle LTX 2.3 Fast models (Replicate)
  if (modelValue.includes("ltx-2.3-fast")) {
    const res = (resolution || "1080p").toLowerCase();
    const durNum = duration ? parseInt(String(duration).replace("s", "")) : 6;
    // Map duration to pricing bucket
    const validDurations = [6, 8, 10, 12, 14, 16, 18, 20];
    let dBucket = validDurations.find((d) => durNum <= d) || 20;

    const table: Record<"1080p" | "2k" | "4k", Record<number, number>> = {
      "1080p": {
        6: 192,
        8: 249,
        10: 306,
        12: 363,
        14: 420,
        16: 476,
        18: 533,
        20: 590,
      },
      "2k": {
        6: 384,
        8: 504,
        10: 625,
        12: 745,
        14: 866,
        16: 986,
        18: 1107,
        20: 1227,
      },
      "4k": {
        6: 768,
        8: 1016,
        10: 1264,
        12: 1513,
        14: 1761,
        16: 2009,
        18: 2257,
        20: 2506,
      },
    };
    const resKey = (
      res.includes("4k") || res.includes("2160")
        ? "4k"
        : res.includes("2k") || res.includes("1440")
          ? "2k"
          : "1080p"
    ) as "1080p" | "2k" | "4k";
    const cost = table[resKey][dBucket];
    return cost || null;
  }

  // Handle LTX 2.3 Pro models (Replicate) - 6/8/10s only
  if (modelValue.includes("ltx-2.3-pro")) {
    const res = (resolution || "1080p").toLowerCase();
    const durNumRaw = duration
      ? parseInt(String(duration).replace("s", ""))
      : 6;
    const durNum: 6 | 8 | 10 = durNumRaw <= 6 ? 6 : durNumRaw <= 8 ? 8 : 10;

    const table: Record<"1080p" | "2k" | "4k", Record<6 | 8 | 10, number>> = {
      "1080p": { 6: 288, 8: 384, 10: 480 },
      "2k": { 6: 576, 8: 768, 10: 960 },
      "4k": { 6: 1152, 8: 1533, 10: 1923 },
    };
    const resKey = (
      res.includes("4k") || res.includes("2160")
        ? "4k"
        : res.includes("2k") || res.includes("1440")
          ? "2k"
          : "1080p"
    ) as "1080p" | "2k" | "4k";
    const cost = table[resKey][durNum];
    return cost || null;
  }

  // Handle Sora 2 models
  if (modelValue.includes("sora2")) {
    const isPro = modelValue.includes("pro");
    const isI2V = modelValue.includes("i2v");
    const isV2V = modelValue.includes("v2v");

    // V2V Remix uses source video's parameters for pricing (handled by backend)
    // Return a default/estimated cost here to avoid "Unknown model" error
    // The actual cost will be calculated on the backend based on source video
    if (isV2V) {
      // Return an estimated default cost (8s, 720p standard as fallback)
      // The backend will use the actual source video parameters for final pricing
      return MODEL_CREDITS_MAPPING["sora2-t2v-8s"] || 640;
    }

    const modelType = isI2V ? "i2v" : "t2v";

    // Duration: 4, 8, or 12 seconds
    const durationNum = duration
      ? parseInt(String(duration).replace("s", ""))
      : 8;
    const durForPricing =
      durationNum === 4 || durationNum === 8 || durationNum === 12
        ? durationNum
        : 8;

    if (isPro) {
      // Pro models: resolution matters (720p or 1080p)
      const res = (resolution || "").toLowerCase().includes("1080")
        ? "1080p"
        : "720p";
      const key = `sora2-pro-${modelType}-${durForPricing}s-${res}`;
      return MODEL_CREDITS_MAPPING[key] || null;
    } else {
      // Standard models: only duration matters (always 720p)
      const key = `sora2-${modelType}-${durForPricing}s`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
  }

  // Handle Kling o1 (duration only)
  if (modelValue === "kling-o1") {
    const durNum = duration ? parseInt(String(duration).replace("s", "")) : 5;
    const key = durNum >= 10 ? "kling-o1-10s" : "kling-o1-5s";
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle Flux 2 Pro with resolution and I2I/T2I
  if (modelValue === "flux-2-pro") {
    // Check if this is I2I (image-to-image) by checking if uploadedImages are present
    const isI2I = Array.isArray(uploadedImages) && uploadedImages.length > 0;

    if (isI2I) {
      // I2I pricing: 36 credits for 1080p, 68 credits for 2K
      if (resolution === "2K") {
        return 68; // Flux 2 Pro I2I 2K
      } else {
        return 36; // Flux 2 Pro I2I 1080p
      }
    } else {
      // T2I pricing: 24 credits for 1080p, 56 credits for 2K
      if (resolution === "2K") {
        return 56; // Flux 2 Pro T2I 2K
      } else {
        return 24; // Flux 2 Pro T2I 1080p
      }
    }
  }

  // Handle FLUX.2 Pro variants
  if (modelValue === "flux-2-pro-1080p") {
    return 24; // FLUX.2 [pro] 1080p
  }
  if (modelValue === "flux-2-pro-2k") {
    return 56; // FLUX.2 [pro] 2K
  }

  // Handle Google nano banana pro with resolution
  if (modelValue === "google/nano-banana-pro") {
    const res = String(resolution || "2K").toUpperCase();
    const is4K =
      res === "4K" ||
      res.includes("AUTO_4K") ||
      res.includes("2160") ||
      res.includes("4096");
    return is4K ? 240 : 120; // 1K/2K => 120, 4K => 240
  }

  // Handle Google nano banana 2 with resolution (Replicate tiers: 0.5K / 1K / 2K / 4K)
  if (modelValue === "google/nano-banana-2") {
    const r = String(resolution || "1K").toUpperCase();
    if (r === "4K") return MODEL_CREDITS_MAPPING["google/nano-banana-2-4k"];
    if (r === "2K") return MODEL_CREDITS_MAPPING["google/nano-banana-2-2k"];
    if (r === "0.5K") return MODEL_CREDITS_MAPPING["google/nano-banana-2-0.5k"];
    return MODEL_CREDITS_MAPPING["google/nano-banana-2-1k"];
  }

  // Handle SeedVR2 models
  if (modelValue.includes("seedvr2")) {
    const durationNum = duration
      ? parseInt(String(duration).replace("s", ""))
      : 5;
    const res = (resolution || "").toLowerCase();
    let resKey = "";
    if (res.includes("2k")) resKey = "2k";
    else if (res.includes("1080")) resKey = "1080p";
    else resKey = "720p";

    const key = `seedvr2-${durationNum}s-${resKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle Crystal Upscaler with resolution
  if (modelValue === "replicate-crystal-upscaler" && resolution) {
    const res = String(resolution).toLowerCase();
    let resKey = "";
    if (res.includes("12k")) resKey = "12k";
    else if (res.includes("8k")) resKey = "8k";
    else if (res.includes("6k")) resKey = "6k";
    else if (res.includes("2160") || res.includes("4k")) resKey = "2160p";
    else if (res.includes("1440")) resKey = "1440p";
    else resKey = "1080p";

    const key = `replicate-crystal-upscaler-${resKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle GPT Image 1.5 with quality
  if (modelValue === "openai/gpt-image-1.5" && quality) {
    const qualityKey = `gpt-image-1.5-${quality.toLowerCase()}`;
    return (
      MODEL_CREDITS_MAPPING[qualityKey] ||
      MODEL_CREDITS_MAPPING["gpt-image-1.5-auto"]
    ); // Default to auto if quality not found
  }

  // Default lookup
  return MODEL_CREDITS_MAPPING[modelValue] || null;
};

// Function to get model info for display
export const getModelCreditInfo = (
  modelValue: string,
  duration?: string,
  resolution?: string,
  generateAudio?: boolean,
  quality?: string,
  aspectRatio?: string,
  inputVideoDurationSec?: number,
) => {
  const credits = getCreditsForModel(
    modelValue,
    duration,
    resolution,
    generateAudio,
    undefined,
    quality,
    aspectRatio,
    inputVideoDurationSec,
  );

  // Special handling for Maya TTS and ElevenLabs SFX - show per-second pricing
  if (modelValue === "maya-tts") {
    return {
      credits: 6, // Per second
      hasCredits: true,
      displayText: "6 credits per second",
    };
  }

  if (modelValue === "elevenlabs-sfx") {
    return {
      credits: 6, // Per second
      hasCredits: true,
      displayText: "6 credits per second",
    };
  }

  if (modelValue === "minimax-music-2") {
    return {
      credits,
      hasCredits: credits !== null,
      displayText: "80 credits for 5 minute music",
    };
  }

  return {
    credits,
    hasCredits: credits !== null,
    displayText: credits ? `${credits} credits` : null,
  };
};

// Helper function to format model name with credits
export const formatModelWithCredits = (
  modelName: string,
  modelValue: string,
  duration?: string,
  resolution?: string,
  generateAudio?: boolean,
  quality?: string,
  aspectRatio?: string,
  inputVideoDurationSec?: number,
): string => {
  const creditInfo = getModelCreditInfo(
    modelValue,
    duration,
    resolution,
    generateAudio,
    quality,
    aspectRatio,
    inputVideoDurationSec,
  );

  if (creditInfo.hasCredits) {
    return `${modelName} - ${creditInfo.displayText}`;
  }

  return modelName;
};

// Helper function to get all models with their credit information
export const getAllModelsWithCredits = () => {
  return Object.entries(MODEL_CREDITS_MAPPING).map(([modelValue, credits]) => ({
    modelValue,
    credits,
    displayText: `${credits} credits`,
  }));
};
