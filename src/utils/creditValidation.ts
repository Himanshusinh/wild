// @ts-ignore
import { creditDistributionData, ModelCreditInfo } from "./creditDistribution";
import { buildCreditModelName, getModelMapping } from "./modelMapping";
import {
  computeSeedance2Credits,
  computeSeedance2FastI2vCredits,
  computeSeedance2FastReferenceCredits,
  computeSeedance2ReferenceCredits,
  computeSeedance2FastT2vCredits,
  getCreditsForModel,
  MODEL_CREDITS_MAPPING,
} from "./modelCredits";

/**
 * Get credit cost for a specific model
 */
export const getCreditCostForModel = (modelName: string): number => {
  console.log(`getCreditCostForModel: Looking for model: "${modelName}"`);
  const model = creditDistributionData.find(
    (m: ModelCreditInfo) => m.modelName === modelName,
  );
  if (!model) {
    console.warn(`getCreditCostForModel: Model not found: "${modelName}"`);
    console.log(
      "Available models:",
      creditDistributionData.map((m: ModelCreditInfo) => m.modelName),
    );
    return 0;
  }
  console.log(
    `getCreditCostForModel: Found model "${modelName}" with cost: ${model.creditsPerGeneration}`,
  );
  return model.creditsPerGeneration;
};

/**
 * Get credit cost for video models using the new mapping system
 */
export const getVideoCreditCost = (
  frontendModel: string,
  resolution?: string,
  duration?: number | string,
  generateAudio?: boolean,
  aspectRatio?: string,
  inputVideoDurationSec?: number,
  hasReferenceVideoInput?: boolean,
): number => {
  const mapping = getModelMapping(frontendModel);
  if (!mapping || mapping.generationType !== "video") {
    console.warn(`Unknown or invalid video model: ${frontendModel}`);
    return 0;
  }

  // For models that use dynamic pricing (like Seedance, WAN, Kling, PixVerse, Veo 3.1, Gen-4 Turbo, Gen-3a Turbo), use getCreditsForModel
  // This handles models with duration/resolution variants that might not be in creditDistributionData
  // Kling Lip Sync uses per-second pricing (2 credits per second)
  if (frontendModel === "kling-lip-sync") {
    // Kling Lip Sync: $0.014 per second = 2 credits per second (rounded up)
    const durationSeconds =
      typeof duration === "number"
        ? duration
        : parseFloat(String(duration || 5)) || 5;
    const costPerSecond = 2;
    const totalCost = Math.ceil(durationSeconds * costPerSecond);
    const finalCost = Math.max(2, totalCost); // Minimum 2 credits
    console.log(
      `Kling Lip Sync cost: ${finalCost} credits for ${durationSeconds} seconds`,
    );
    return finalCost;
  }
  // Kling o1 (FAL) fixed per-duration pricing
  if (frontendModel === "kling-o1") {
    const dur =
      typeof duration === "number"
        ? duration
        : parseFloat(String(duration || 5)) || 5;
    // 5s -> 336, 10s (or >=10) -> 671
    return dur >= 10 ? 671 : 336;
  }
  // WAN 2.2 Animate models use duration-based pricing: 8 credits per 1 second of input video
  if (
    frontendModel === "wan-2.2-animate-replace" ||
    frontendModel === "wan-2.2-animate-animation"
  ) {
    const runtimeSecondsRaw = duration || 0;
    const runtimeSeconds =
      typeof runtimeSecondsRaw === "number"
        ? runtimeSecondsRaw
        : parseFloat(String(runtimeSecondsRaw)) || 0;

    // Snap near-integer durations to avoid +1s due to container/metadata drift
    // (e.g., 5.0004s should bill as 5s, not 6s).
    const rounded = Math.round(runtimeSeconds);
    const snappedSeconds =
      Number.isFinite(runtimeSeconds) &&
      Math.abs(runtimeSeconds - rounded) <= 0.05
        ? rounded
        : Math.ceil(runtimeSeconds);
    const billedSeconds = Math.max(1, snappedSeconds);
    const costPerSecond = 8;
    const finalCost = billedSeconds * costPerSecond;
    console.log(
      `WAN 2.2 Animate cost: ${finalCost} credits for ${billedSeconds}s (raw=${runtimeSeconds})`,
    );
    return finalCost;
  }
  // Runway Act-Two (act_two) - uses SKU-based pricing from backend
  // Frontend shows estimated cost, actual cost calculated by backend
  if (frontendModel === "runway-act-two") {
    // Estimate: similar to other Runway video models, use a default estimate
    // Actual cost will be determined by backend using SKU
    const estimatedCost = 50; // Placeholder estimate - backend will calculate actual cost
    console.log(
      `Runway Act-Two estimated cost: ${estimatedCost} credits (actual cost calculated by backend)`,
    );
    return estimatedCost;
  }
  if (frontendModel === "seedance-2.0-t2v") {
    return computeSeedance2Credits(resolution, duration, aspectRatio);
  }
  if (
    frontendModel === "seedance-2.0-fast" ||
    frontendModel === "seedance-2.0-fast-t2v" ||
    frontendModel === "seedance-2.0-fast-i2v"
  ) {
    return computeSeedance2FastI2vCredits(resolution, duration, aspectRatio);
  }
  if (frontendModel === "seedance-2.0-fast-r2v") {
    return computeSeedance2FastReferenceCredits(
      resolution,
      duration,
      aspectRatio,
      inputVideoDurationSec,
      Boolean(hasReferenceVideoInput),
    );
  }
  if (frontendModel === "seedance-2.0-r2v") {
    return computeSeedance2ReferenceCredits(
      resolution,
      duration,
      aspectRatio,
      inputVideoDurationSec,
      Boolean(hasReferenceVideoInput),
    );
  }
  if (
    frontendModel.includes("seedance") ||
    frontendModel.includes("wan-2.5") ||
    frontendModel.startsWith("kling-") ||
    frontendModel.includes("pixverse") ||
    frontendModel.includes("veo3.1") ||
    frontendModel.includes("sora2") ||
    frontendModel.includes("ltx2") ||
    frontendModel.includes("ltx-2.3-fast") ||
    frontendModel.includes("ltx-2.3-pro") ||
    frontendModel === "gen4_turbo" ||
    frontendModel === "gen3a_turbo"
  ) {
    // Use default values if not provided for WAN models to avoid "Unknown model" error
    const defaultDuration = duration == null || duration === "" ? 5 : duration;
    const defaultResolution = resolution || "720p";
    // For models where pricing depends on audio, pass generateAudio through
    const audioParam =
      frontendModel === "kling-2.6-pro" ||
      frontendModel.startsWith("kling-v3") ||
      frontendModel.includes("seedance-1.5") ||
      frontendModel === "pixverse-v6-t2v" ||
      frontendModel === "pixverse-v6-i2v"
        ? generateAudio
        : undefined;
    const cost = getCreditsForModel(
      frontendModel,
      `${defaultDuration}s`,
      defaultResolution,
      audioParam,
      undefined,
      undefined,
      undefined,
      inputVideoDurationSec,
      hasReferenceVideoInput,
    );
    if (cost !== null && cost > 0) {
      console.log(
        `Found cost via getCreditsForModel: ${cost} for model: ${frontendModel}`,
      );
      return cost;
    }
    // If still no cost found, try with just the base model name (without duration/resolution)
    // This provides a fallback to avoid "Unknown model" error
    if (frontendModel.includes("wan-2.5")) {
      const baseCost = getCreditsForModel(frontendModel, "5s", "720p");
      if (baseCost !== null && baseCost > 0) {
        console.log(
          `Found fallback cost via getCreditsForModel: ${baseCost} for model: ${frontendModel}`,
        );
        return baseCost;
      }
    }
  }

  // Build the complete model name with options
  // For Kling 2.6 Pro, include generateAudio in options
  const buildOptions: any = { resolution, duration };
  if (
    frontendModel === "kling-2.6-pro" ||
    frontendModel.startsWith("kling-v3")
  ) {
    buildOptions.generateAudio = generateAudio;
  }
  if (
    frontendModel === "pixverse-v6-t2v" ||
    frontendModel === "pixverse-v6-i2v"
  ) {
    buildOptions.generateAudio = generateAudio;
  }
  const creditModelName = buildCreditModelName(frontendModel, buildOptions);
  if (!creditModelName) {
    console.warn(`Failed to build credit model name for: ${frontendModel}`);
    return 0;
  }

  console.log(`Looking for video model: ${creditModelName}`);
  const cost = getCreditCostForModel(creditModelName);
  console.log(`Found cost: ${cost} for model: ${creditModelName}`);
  return cost;
};

/**
 * Get credit cost for MiniMax video models based on resolution and duration (legacy function)
 */
export const getMiniMaxVideoCreditCost = (
  model: string,
  resolution?: string,
  duration?: number | string,
): number => {
  return getVideoCreditCost(model, resolution, duration);
};

/**
 * Get credit cost for Runway video models based on duration (legacy function)
 */
export const getRunwayVideoCreditCost = (
  model: string,
  duration?: number | string,
): number => {
  return getVideoCreditCost(model, undefined, duration);
};

/**
 * Get credit cost for music generation
 */
export const getMusicCreditCost = (
  frontendModel: string,
  duration?: number,
  inputs?: any[],
  text?: string,
): number => {
  const mapping = getModelMapping(frontendModel);
  // Accept 'music', 'sfx', 'text-to-dialogue', and 'text-to-speech' generation types for audio-related models
  const validGenerationTypes = [
    "music",
    "sfx",
    "text-to-dialogue",
    "text-to-speech",
  ];
  if (
    !mapping ||
    !validGenerationTypes.includes(mapping.generationType as string)
  ) {
    console.warn(`Unknown or invalid music model: ${frontendModel}`);
    return 0;
  }

  // Handle Maya TTS with per-second pricing (6 credits per second) based on text length
  // Same logic as backend: estimate duration from text length (~15 characters per second)
  if (
    frontendModel === "maya-tts" &&
    text != null &&
    typeof text === "string"
  ) {
    // Estimate duration: ~15 characters per second (matches backend for accurate estimation)
    // Minimum 1 second
    const estimatedDuration = Math.max(1, Math.ceil(text.length / 15));
    const creditsPerSecond = 6;
    return estimatedDuration * creditsPerSecond;
  }

  // Handle ElevenLabs Dialogue with character-based pricing (same as TTS)
  if (
    frontendModel === "elevenlabs-dialogue" &&
    Array.isArray(inputs) &&
    inputs.length > 0
  ) {
    // Calculate total character count across all inputs
    const totalCharCount = inputs.reduce((sum, input) => {
      const text = input?.text || "";
      return sum + (typeof text === "string" ? text.length : 0);
    }, 0);

    // Use same pricing as TTS: 220 for <=1000, 420 for 1001-2000
    if (totalCharCount <= 1000) {
      return 220;
    } else if (totalCharCount <= 2000) {
      return 420;
    } else {
      // For >2000, use 2000 pricing (shouldn't happen with validation, but handle gracefully)
      return 420;
    }
  }

  // Handle ElevenLabs SFX with per-second pricing (6 credits per second)
  if (frontendModel === "elevenlabs-sfx" && duration != null) {
    // Round up to nearest second for pricing
    const durationSeconds = Math.ceil(duration);
    const creditsPerSecond = 6;
    return durationSeconds * creditsPerSecond;
  }

  // First try to get cost from creditDistributionData using creditModelName
  console.log(`Looking for music model: ${mapping.creditModelName}`);
  let cost = getCreditCostForModel(mapping.creditModelName);

  // If not found in creditDistributionData, try direct lookup in MODEL_CREDITS_MAPPING using frontend value
  if (cost === 0) {
    const directCost = MODEL_CREDITS_MAPPING[frontendModel];
    if (directCost !== undefined && directCost > 0) {
      cost = directCost;
      console.log(
        `Found cost via direct mapping: ${cost} for model: ${frontendModel}`,
      );
    } else {
      console.log(`Found cost: ${cost} for model: ${mapping.creditModelName}`);
    }
  } else {
    console.log(`Found cost: ${cost} for model: ${mapping.creditModelName}`);
  }

  return cost;
};

/**
 * Calculate total credit cost for image generation
 */
export const getImageGenerationCreditCost = (
  frontendModel: string,
  count: number = 1,
  frameSize?: string,
  style?: string,
  resolution?: string,
  uploadedImages?: any[],
  quality?: string,
): number => {
  // Qwen Image Edit: backend charges a flat per-generation cost (not per image)
  // Keep frontend validation/reservation aligned with backend.
  if (
    frontendModel === "qwen-image-edit-2511" ||
    frontendModel === "qwen-image-edit" ||
    frontendModel === "qwen-image-edit-2512"
  ) {
    const mapping = getModelMapping(frontendModel);
    const baseCost = mapping
      ? getCreditCostForModel(mapping.creditModelName)
      : 0;
    return baseCost && baseCost > 0
      ? baseCost
      : frontendModel === "qwen-image-edit-2512"
        ? 60
        : 80;
  }

  if (
    frontendModel === "recraft-ai/recraft-v4" ||
    frontendModel === "recraft-v4"
  ) {
    const mapping = getModelMapping("recraft-ai/recraft-v4");
    const baseCost = mapping
      ? getCreditCostForModel(mapping.creditModelName)
      : 0;
    const resolvedBaseCost = baseCost && baseCost > 0 ? baseCost : 32;
    return resolvedBaseCost * Math.max(1, Math.min(count, 4));
  }

  // z-image-turbo uses the shared pricing lookup and currently costs 4 credits.

  // Special case: WILDMINDIMAGE is free (0 credits)
  if (frontendModel === "wildmindimage") {
    console.log(
      "getImageGenerationCreditCost: wildmindimage is free (0 credits)",
    );
    return 0;
  }

  const mapping = getModelMapping(frontendModel);
  if (!mapping || mapping.generationType !== "image") {
    console.warn(`Unknown or invalid image model: ${frontendModel}`);
    return 0;
  }

  // Handle Flux 2 Pro with I2I/T2I pricing
  if (frontendModel === "flux-2-pro") {
    const isI2I = Array.isArray(uploadedImages) && uploadedImages.length > 0;
    const res = resolution?.toUpperCase() || "1K";
    let cost: number;
    if (isI2I) {
      // I2I pricing: 36 credits for 1080p, 68 credits for 2K
      cost = res === "2K" ? 68 : 36;
    } else {
      // T2I pricing: 24 credits for 1080p, 56 credits for 2K
      cost = res === "2K" ? 56 : 24;
    }
    console.log(
      `Flux 2 Pro ${isI2I ? "I2I" : "T2I"} cost: ${cost} credits for resolution: ${res}`,
    );
    return cost * Math.max(1, Math.min(count, 4)); // Max 4 images
  }

  // Handle resolution-based pricing for google/nano-banana-2 (Replicate: 0.5K, 1K, 2K, 4K)
  if (frontendModel === "google/nano-banana-2") {
    const res = resolution?.toUpperCase() || "1K";
    let cost = 64; // Default 1K
    if (res === "0.5K") {
      cost = 48;
    } else if (res === "2K") {
      cost = 96;
    } else if (res === "4K") {
      cost = 128;
    }
    console.log(
      `Google Nano Banana 2 cost: ${cost} credits for resolution: ${res}`,
    );
    return cost * Math.max(1, Math.min(count, 4)); // Max 4 images
  }

  // Handle resolution-based pricing for nano-banana-pro
  if (frontendModel === "google/nano-banana-pro") {
    const res = String(resolution || "2K").toUpperCase();
    const is4K =
      res === "4K" ||
      res.includes("AUTO_4K") ||
      res.includes("2160") ||
      res.includes("4096");
    const cost = is4K ? 240 : 120;
    console.log(`Nano Banana Pro cost: ${cost} credits for resolution: ${res}`);
    return cost * Math.max(1, Math.min(count, 4)); // Max 4 images
  }

  // Handle GPT Image 1.5 quality-based pricing
  if (frontendModel === "openai/gpt-image-1.5") {
    const cost = getCreditsForModel(
      frontendModel,
      undefined,
      undefined,
      undefined,
      undefined,
      quality || "auto",
    );
    const resolvedCost = cost && cost > 0 ? cost : 109;
    return resolvedCost * Math.max(1, Math.min(count, 4));
  }

  if (frontendModel === "openai/gpt-image-2") {
    const cost = getCreditsForModel(
      frontendModel,
      undefined,
      undefined,
      undefined,
      undefined,
      quality || "auto",
    );
    const resolvedCost = cost && cost > 0 ? cost : 102;
    return resolvedCost * Math.max(1, Math.min(count, 10));
  }

  // First try to get cost from MODEL_CREDITS_MAPPING (direct lookup)
  // This handles models like nano-banana-pro that may not be in creditDistributionData with exact name
  const directCost = MODEL_CREDITS_MAPPING[frontendModel];
  if (directCost !== undefined && directCost > 0) {
    console.log(
      `Found cost via direct mapping: ${directCost} for model: ${frontendModel}`,
    );
    return directCost * Math.max(1, Math.min(count, 4)); // Max 4 images
  }

  // For Flux 2 Pro, use getCreditsForModel with uploadedImages
  if (frontendModel === "flux-2-pro") {
    const cost = getCreditsForModel(
      frontendModel,
      undefined,
      resolution,
      undefined,
      uploadedImages,
    );
    if (cost !== null && cost > 0) {
      console.log(`Found Flux 2 Pro cost via getCreditsForModel: ${cost}`);
      return cost * Math.max(1, Math.min(count, 4));
    }
  }

  // First try to get cost from creditDistributionData using creditModelName
  console.log(`Looking for image model: ${mapping.creditModelName}`);
  let baseCost = getCreditCostForModel(mapping.creditModelName);

  // If not found in creditDistributionData, try direct lookup in MODEL_CREDITS_MAPPING using frontend value
  if (baseCost === 0) {
    const directCost = MODEL_CREDITS_MAPPING[frontendModel];
    if (directCost !== undefined && directCost > 0) {
      baseCost = directCost;
      console.log(
        `Found cost via direct mapping: ${baseCost} for model: ${frontendModel}`,
      );
    } else {
      console.log(
        `Found cost: ${baseCost} for model: ${mapping.creditModelName}`,
      );
    }
  } else {
    console.log(
      `Found base cost: ${baseCost} for model: ${mapping.creditModelName}`,
    );
  }

  // If still no cost found, return 0 (will trigger "Unknown model" error)
  if (baseCost === 0) {
    console.warn(
      `No cost found for model: ${frontendModel} (creditModelName: ${mapping.creditModelName})`,
    );
    return 0;
  }

  return baseCost * Math.max(1, Math.min(count, 4)); // Max 4 images
};

/**
 * Calculate total credit cost for video generation
 */
export const getVideoGenerationCreditCost = (
  provider: "minimax" | "runway" | "fal" | "replicate",
  frontendModel: string,
  resolution?: string,
  duration?: number | string,
  aspectRatio?: string,
  inputVideoDurationSec?: number,
  hasReferenceVideoInput?: boolean,
): number => {
  return getVideoCreditCost(
    frontendModel,
    resolution,
    duration,
    undefined,
    aspectRatio,
    inputVideoDurationSec,
    hasReferenceVideoInput,
  );
};

/**
 * Calculate total credit cost for music generation
 */
export const getMusicGenerationCreditCost = (
  frontendModel: string,
  duration?: number,
  inputs?: any[],
  text?: string, // Added for Maya TTS per-second pricing based on text length
): number => {
  return getMusicCreditCost(frontendModel, duration, inputs, text);
};

/**
 * Validate if user has enough credits for a generation
 */
export const validateCredits = (
  currentBalance: number,
  requiredCredits: number,
): {
  hasEnoughCredits: boolean;
  shortfall?: number;
  message?: string;
} => {
  const hasEnoughCredits = currentBalance >= requiredCredits;
  const shortfall = hasEnoughCredits
    ? undefined
    : requiredCredits - currentBalance;

  let message: string | undefined;
  if (!hasEnoughCredits) {
    message = `Insufficient credits. You need ${requiredCredits} credits but only have ${currentBalance}.`;
  }

  return {
    hasEnoughCredits,
    shortfall,
    message,
  };
};

/**
 * Get user-friendly error message for insufficient credits
 */
export const getInsufficientCreditsMessage = (
  currentBalance: number,
  requiredCredits: number,
  modelName: string,
): string => {
  const shortfall = requiredCredits - currentBalance;
  return `Insufficient credits for ${modelName}. You need ${requiredCredits} credits but only have ${currentBalance}. You're ${shortfall} credits short.`;
};

/**
 * Format credit balance for display
 */
export const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  }
  return credits.toFixed(0);
};

/**
 * Get all available models with their credit costs
 */
export const getAllModelsWithCosts = (): Array<{
  name: string;
  credits: number;
  provider: string;
  type: "image" | "video" | "music";
}> => {
  return creditDistributionData.map((model: ModelCreditInfo) => ({
    name: model.modelName,
    credits: model.creditsPerGeneration,
    provider: getProviderFromModel(model.modelName),
    type: getTypeFromModel(model.modelName),
  }));
};

/**
 * Helper to determine provider from model name
 */
const getProviderFromModel = (modelName: string): string => {
  if (modelName.toLowerCase().includes("flux")) return "bfl";
  if (
    modelName.toLowerCase().includes("runway") ||
    modelName.toLowerCase().includes("gen-")
  )
    return "runway";
  if (modelName.toLowerCase().includes("minimax")) return "minimax";
  if (modelName.toLowerCase().includes("google")) return "google";
  if (modelName.toLowerCase().includes("seedream")) return "fal";
  if (modelName.toLowerCase().includes("music")) return "minimax";
  if (modelName.toLowerCase().includes("veo")) return "google";
  return "unknown";
};

/**
 * Helper to determine type from model name
 */
const getTypeFromModel = (modelName: string): "image" | "video" | "music" => {
  if (modelName.toLowerCase().includes("music")) return "music";
  if (
    modelName.toLowerCase().includes("veo") ||
    modelName.toLowerCase().includes("gen-") ||
    modelName.toLowerCase().includes("minimax") ||
    modelName.toLowerCase().includes("director") ||
    modelName.toLowerCase().includes("s2v")
  )
    return "video";
  return "image";
};
