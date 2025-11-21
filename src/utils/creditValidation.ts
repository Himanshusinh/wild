// @ts-ignore
import { creditDistributionData, ModelCreditInfo } from './creditDistribution';
import { buildCreditModelName, getModelMapping } from './modelMapping';
import { getCreditsForModel, MODEL_CREDITS_MAPPING } from './modelCredits';

/**
 * Get credit cost for a specific model
 */
export const getCreditCostForModel = (modelName: string): number => {
  console.log(`getCreditCostForModel: Looking for model: "${modelName}"`);
  const model = creditDistributionData.find((m: ModelCreditInfo) => m.modelName === modelName);
  if (!model) {
    console.warn(`getCreditCostForModel: Model not found: "${modelName}"`);
    console.log('Available models:', creditDistributionData.map((m: ModelCreditInfo) => m.modelName));
    return 0;
  }
  console.log(`getCreditCostForModel: Found model "${modelName}" with cost: ${model.creditsPerGeneration}`);
  return model.creditsPerGeneration;
};

/**
 * Get credit cost for video models using the new mapping system
 */
export const getVideoCreditCost = (frontendModel: string, resolution?: string, duration?: number): number => {
  const mapping = getModelMapping(frontendModel);
  if (!mapping || mapping.generationType !== 'video') {
    console.warn(`Unknown or invalid video model: ${frontendModel}`);
    return 0;
  }

        // For models that use dynamic pricing (like Seedance, WAN, Kling, PixVerse, Veo 3.1, Gen-4 Turbo, Gen-3a Turbo), use getCreditsForModel
        // This handles models with duration/resolution variants that might not be in creditDistributionData
        // Kling Lip Sync uses per-second pricing (2 credits per second)
        if (frontendModel === 'kling-lip-sync') {
          // Kling Lip Sync: $0.014 per second = 2 credits per second (rounded up)
          const durationSeconds = duration || 5;
          const costPerSecond = 2;
          const totalCost = Math.ceil(durationSeconds * costPerSecond);
          const finalCost = Math.max(2, totalCost); // Minimum 2 credits
          console.log(`Kling Lip Sync cost: ${finalCost} credits for ${durationSeconds} seconds`);
          return finalCost;
        }
        // WAN 2.2 Animate Replace uses per-second pricing (1 credit per second)
        if (frontendModel === 'wan-2.2-animate-replace') {
          // WAN 2.2 Animate Replace: $0.004 per second = 0.4 credits per second, rounded up to 1 credit per second
          const runtimeSeconds = duration || 5; // Estimate based on input video duration
          const costPerSecond = 1;
          const totalCost = Math.ceil(runtimeSeconds * costPerSecond);
          const finalCost = Math.max(1, totalCost); // Minimum 1 credit
          console.log(`WAN 2.2 Animate Replace cost: ${finalCost} credits for ${runtimeSeconds} seconds`);
          return finalCost;
        }
        if (frontendModel === 'wan-2.2-animate-animation') {
          // WAN 2.2 Animate Animation: $0.004 per second = 0.4 credits per second, rounded up to 1 credit per second
          const runtimeSeconds = duration || 5; // Estimate based on input video duration
          const costPerSecond = 1;
          const totalCost = Math.ceil(runtimeSeconds * costPerSecond);
          const finalCost = Math.max(1, totalCost); // Minimum 1 credit
          console.log(`WAN 2.2 Animate Animation cost: ${finalCost} credits for ${runtimeSeconds} seconds`);
          return finalCost;
        }
        // Runway Act-Two (act_two) - uses SKU-based pricing from backend
        // Frontend shows estimated cost, actual cost calculated by backend
        if (frontendModel === 'runway-act-two') {
          // Estimate: similar to other Runway video models, use a default estimate
          // Actual cost will be determined by backend using SKU
          const estimatedCost = 50; // Placeholder estimate - backend will calculate actual cost
          console.log(`Runway Act-Two estimated cost: ${estimatedCost} credits (actual cost calculated by backend)`);
          return estimatedCost;
        }
        if (frontendModel.includes('seedance') || frontendModel.includes('wan-2.5') || frontendModel.startsWith('kling-') || frontendModel.includes('pixverse') || frontendModel.includes('veo3.1') || frontendModel.includes('sora2') || frontendModel.includes('ltx2') || frontendModel === 'gen4_turbo' || frontendModel === 'gen3a_turbo') {
          // Use default values if not provided for WAN models to avoid "Unknown model" error
          const defaultDuration = duration || 5;
          const defaultResolution = resolution || '720p';
          const cost = getCreditsForModel(frontendModel, `${defaultDuration}s`, defaultResolution);
          if (cost !== null && cost > 0) {
            console.log(`Found cost via getCreditsForModel: ${cost} for model: ${frontendModel}`);
            return cost;
          }
          // If still no cost found, try with just the base model name (without duration/resolution)
          // This provides a fallback to avoid "Unknown model" error
          if (frontendModel.includes('wan-2.5')) {
            const baseCost = getCreditsForModel(frontendModel, '5s', '720p');
            if (baseCost !== null && baseCost > 0) {
              console.log(`Found fallback cost via getCreditsForModel: ${baseCost} for model: ${frontendModel}`);
              return baseCost;
            }
          }
        }

  // Build the complete model name with options
  const creditModelName = buildCreditModelName(frontendModel, { resolution, duration });
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
export const getMiniMaxVideoCreditCost = (model: string, resolution?: string, duration?: number): number => {
  return getVideoCreditCost(model, resolution, duration);
};

/**
 * Get credit cost for Runway video models based on duration (legacy function)
 */
export const getRunwayVideoCreditCost = (model: string, duration?: number): number => {
  return getVideoCreditCost(model, undefined, duration);
};

/**
 * Get credit cost for music generation
 */
export const getMusicCreditCost = (frontendModel: string, duration?: number): number => {
  const mapping = getModelMapping(frontendModel);
  // Accept both 'music' and 'sfx' generation types for audio-related models
  if (!mapping || (mapping.generationType !== 'music' && mapping.generationType !== 'sfx')) {
    console.warn(`Unknown or invalid music model: ${frontendModel}`);
    return 0;
  }

  // First try to get cost from creditDistributionData using creditModelName
  console.log(`Looking for music model: ${mapping.creditModelName}`);
  let cost = getCreditCostForModel(mapping.creditModelName);
  
  // If not found in creditDistributionData, try direct lookup in MODEL_CREDITS_MAPPING using frontend value
  if (cost === 0) {
    const directCost = MODEL_CREDITS_MAPPING[frontendModel];
    if (directCost !== undefined && directCost > 0) {
      cost = directCost;
      console.log(`Found cost via direct mapping: ${cost} for model: ${frontendModel}`);
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
  style?: string
): number => {
  const mapping = getModelMapping(frontendModel);
  if (!mapping || mapping.generationType !== 'image') {
    console.warn(`Unknown or invalid image model: ${frontendModel}`);
    return 0;
  }

  console.log(`Looking for image model: ${mapping.creditModelName}`);
  const baseCost = getCreditCostForModel(mapping.creditModelName);
  console.log(`Found base cost: ${baseCost} for model: ${mapping.creditModelName}`);
  return baseCost * Math.max(1, Math.min(count, 4)); // Max 4 images
};

/**
 * Calculate total credit cost for video generation
 */
export const getVideoGenerationCreditCost = (
  provider: 'minimax' | 'runway' | 'fal' | 'replicate',
  frontendModel: string,
  resolution?: string,
  duration?: number
): number => {
  return getVideoCreditCost(frontendModel, resolution, duration);
};

/**
 * Calculate total credit cost for music generation
 */
export const getMusicGenerationCreditCost = (
  frontendModel: string,
  duration?: number
): number => {
  return getMusicCreditCost(frontendModel, duration);
};

/**
 * Validate if user has enough credits for a generation
 */
export const validateCredits = (
  currentBalance: number,
  requiredCredits: number
): {
  hasEnoughCredits: boolean;
  shortfall?: number;
  message?: string;
} => {
  const hasEnoughCredits = currentBalance >= requiredCredits;
  const shortfall = hasEnoughCredits ? undefined : requiredCredits - currentBalance;
  
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
  modelName: string
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
  type: 'image' | 'video' | 'music';
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
  if (modelName.toLowerCase().includes('flux')) return 'bfl';
  if (modelName.toLowerCase().includes('runway') || modelName.toLowerCase().includes('gen-')) return 'runway';
  if (modelName.toLowerCase().includes('minimax')) return 'minimax';
  if (modelName.toLowerCase().includes('google')) return 'google';
  if (modelName.toLowerCase().includes('seedream')) return 'fal';
  if (modelName.toLowerCase().includes('music')) return 'minimax';
  if (modelName.toLowerCase().includes('veo')) return 'google';
  return 'unknown';
};

/**
 * Helper to determine type from model name
 */
const getTypeFromModel = (modelName: string): 'image' | 'video' | 'music' => {
  if (modelName.toLowerCase().includes('music')) return 'music';
  if (modelName.toLowerCase().includes('veo') || 
      modelName.toLowerCase().includes('gen-') || 
      modelName.toLowerCase().includes('minimax') ||
      modelName.toLowerCase().includes('director') ||
      modelName.toLowerCase().includes('s2v')) return 'video';
  return 'image';
};
