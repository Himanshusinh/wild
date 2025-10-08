// @ts-ignore
import { creditDistributionData, ModelCreditInfo } from './creditDistribution';
import { buildCreditModelName, getModelMapping } from './modelMapping';

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
  if (!mapping || mapping.generationType !== 'music') {
    console.warn(`Unknown or invalid music model: ${frontendModel}`);
    return 0;
  }

  console.log(`Looking for music model: ${mapping.creditModelName}`);
  const cost = getCreditCostForModel(mapping.creditModelName);
  console.log(`Found cost: ${cost} for model: ${mapping.creditModelName}`);
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
  provider: 'minimax' | 'runway' | 'fal',
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
