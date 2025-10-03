import { creditDistributionData } from './creditDistribution';

// Direct mapping between dropdown model values and their credit costs
export const MODEL_CREDITS_MAPPING: Record<string, number> = {
  // Image Generation Models
  'flux-kontext-pro': 110,      // FLUX.1 Kontext [pro]
  'flux-kontext-max': 190,      // FLUX.1 Kontext [max]
  'flux-pro-1.1': 110,          // FLUX 1.1 [pro]
  'flux-pro-1.1-ultra': 150,    // FLUX 1.1 [pro] Ultra
  'flux-pro': 130,              // FLUX.1 [pro]
  'flux-dev': 90,               // FLUX.1 [dev]
  'gen4_image': 190,            // Runway Gen 4 Image 1080p
  'gen4_image_turbo': 70,       // Runway Gen 4 Image Turbo
  'minimax-image-01': 37,       // Minimax Image-01
  'gemini-25-flash-image': 108, // Google nano banana (T2I)

  // Product Generation Models
  'flux-krea': 130,             // Similar to FLUX.1 [pro]
  'flux-kontext-dev': 90,       // Similar to FLUX.1 [dev]

  // Video Generation Models - Default durations
  'gen4_turbo': 620,            // Gen-4 Turbo 5s (default)
  'gen3a_turbo': 620,           // Gen-3a Turbo 5s (default)
  'gen4_aleph': 3120,           // Gen-4 Aleph 10s
  'MiniMax-Hailuo-02': 320,     // Minimax-Hailuo-02 512P 6s (default)
  'T2V-01-Director': 980,       // T2V-01-Director
  'I2V-01-Director': 980,       // I2V-01-Director
  'S2V-01': 1420,               // S2V-01

  // Music Generation Models
  'music-1.5': 90,              // Music 1.5 (Up to 90s)

  // Ad Generation Models (same as image generation)
  'flux-kontext-pro-ad': 110,
  'flux-kontext-max-ad': 190,

  // Video models with duration and resolution variants
  // Minimax-Hailuo-02 variants
  'MiniMax-Hailuo-02-512P-6s': 320,
  'MiniMax-Hailuo-02-512P-10s': 420,
  'MiniMax-Hailuo-02-768P-6s': 680,
  'MiniMax-Hailuo-02-768P-10s': 1240,
  'MiniMax-Hailuo-02-1080P-6s': 1100,

  // Gen-4 Turbo variants
  'gen4_turbo-5s': 620,
  'gen4_turbo-10s': 1120,

  // Gen-3a Turbo variants
  'gen3a_turbo-5s': 620,
  'gen3a_turbo-10s': 1120,

  // Veo3 models
  'veo3-t2v-4s': 3320,
  'veo3-t2v-6s': 4920,
  'veo3-t2v-8s': 6520,
  'veo3-i2v-8s': 6520,
  'veo3-fast-t2v-4s': 1320,
  'veo3-fast-t2v-6s': 1920,
  'veo3-fast-t2v-8s': 2520,
  'veo3-fast-i2v-8s': 2520,
  'RW-veo3-8s': 6520,
};

// Function to get credit cost for a model
export const getCreditsForModel = (modelValue: string, duration?: string, resolution?: string): number | null => {
  // Handle special cases for video models with duration and resolution
  if (modelValue === 'MiniMax-Hailuo-02' && duration && resolution) {
    const durationNum = parseInt(duration.replace('s', ''));
    const resolutionP = resolution.replace('P', 'P');
    const key = `MiniMax-Hailuo-02-${resolutionP}-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  } 
  
  if (modelValue === 'gen4_turbo' && duration) {
    const durationNum = parseInt(duration.replace('s', ''));
    const key = `gen4_turbo-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  } 
  
  if (modelValue === 'gen3a_turbo' && duration) {
    const durationNum = parseInt(duration.replace('s', ''));
    const key = `gen3a_turbo-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle veo3 models
  if (modelValue.includes('veo3')) {
    if (modelValue.includes('fast')) {
      if (duration === '4s') return MODEL_CREDITS_MAPPING['veo3-fast-t2v-4s'];
      else if (duration === '6s') return MODEL_CREDITS_MAPPING['veo3-fast-t2v-6s'];
      else if (duration === '8s') return MODEL_CREDITS_MAPPING[modelValue.includes('i2v') ? 'veo3-fast-i2v-8s' : 'veo3-fast-t2v-8s'];
    } else {
      if (duration === '4s') return MODEL_CREDITS_MAPPING['veo3-t2v-4s'];
      else if (duration === '6s') return MODEL_CREDITS_MAPPING['veo3-t2v-6s'];
      else if (duration === '8s') return MODEL_CREDITS_MAPPING[modelValue.includes('i2v') ? 'veo3-i2v-8s' : 'veo3-t2v-8s'];
    }
  }

  // Default lookup
  return MODEL_CREDITS_MAPPING[modelValue] || null;
};

// Function to get model info for display
export const getModelCreditInfo = (modelValue: string, duration?: string, resolution?: string) => {
  const credits = getCreditsForModel(modelValue, duration, resolution);
  return {
    credits,
    hasCredits: credits !== null,
    displayText: credits ? `${credits} credits` : null
  };
};

// Helper function to format model name with credits
export const formatModelWithCredits = (modelName: string, modelValue: string, duration?: string, resolution?: string): string => {
  const creditInfo = getModelCreditInfo(modelValue, duration, resolution);
  
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
    displayText: `${credits} credits`
  }));
};
