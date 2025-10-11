/**
 * Model mapping between frontend dropdown values and credit distribution data
 * This ensures credit costs are calculated correctly for each model
 */

export interface ModelMapping {
  frontendValue: string;
  creditModelName: string;
  generationType: 'image' | 'video' | 'music';
  provider: string;
  options?: {
    resolution?: string[];
    duration?: number[];
    frameSize?: string[];
  };
}

/**
 * Complete mapping of frontend model values to credit distribution model names
 */
export const MODEL_MAPPING: ModelMapping[] = [
  // IMAGE GENERATION MODELS
  {
    frontendValue: 'flux-kontext-pro',
    creditModelName: 'FLUX.1 Kontext [pro]',
    generationType: 'image',
    provider: 'bfl'
  },
  {
    frontendValue: 'flux-kontext-max',
    creditModelName: 'FLUX.1 Kontext [max]',
    generationType: 'image',
    provider: 'bfl'
  },
  {
    frontendValue: 'flux-pro-1.1-ultra',
    creditModelName: 'FLUX 1.1 [pro] Ultra',
    generationType: 'image',
    provider: 'bfl'
  },
  {
    frontendValue: 'flux-pro-1.1',
    creditModelName: 'FLUX 1.1 [pro]',
    generationType: 'image',
    provider: 'bfl'
  },
  {
    frontendValue: 'flux-pro',
    creditModelName: 'FLUX.1 [pro]',
    generationType: 'image',
    provider: 'bfl'
  },
  {
    frontendValue: 'flux-dev',
    creditModelName: 'FLUX.1 [dev]',
    generationType: 'image',
    provider: 'bfl'
  },
  {
    frontendValue: 'gen4_image',
    creditModelName: 'Runway Gen 4 Image 720p',
    generationType: 'image',
    provider: 'runway'
  },
  {
    frontendValue: 'gen4_image_1080p',
    creditModelName: 'Runway Gen 4 Image 1080p',
    generationType: 'image',
    provider: 'runway'
  },
  {
    frontendValue: 'gen4_image_turbo',
    creditModelName: 'Runway Gen 4 Image Turbo',
    generationType: 'image',
    provider: 'runway'
  },
  {
    frontendValue: 'minimax-image-01',
    creditModelName: 'Minimax Image-01',
    generationType: 'image',
    provider: 'minimax'
  },
  {
    frontendValue: 'gemini-25-flash-image',
    creditModelName: 'Google nano banana (T2I)',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'imagen-4-ultra',
    creditModelName: 'Imagen 4 Ultra',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'imagen-4',
    creditModelName: 'Imagen 4',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'imagen-4-fast',
    creditModelName: 'Imagen 4 Fast',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'seedream-v4',
    creditModelName: 'Seedream v4 (T2I)',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'ideogram-ai/ideogram-v3',
    creditModelName: 'replicate/ideogram-ai/ideogram-v3-turbo',
    generationType: 'image',
    provider: 'replicate'
  },

  // VIDEO GENERATION MODELS
  {
    frontendValue: 'MiniMax-Hailuo-02',
    creditModelName: 'Minimax-Hailuo-02', // Base name, resolution/duration appended dynamically
    generationType: 'video',
    provider: 'minimax',
    options: {
      resolution: ['512P', '768P', '1080P'],
      duration: [6, 10]
    }
  },
  {
    frontendValue: 'T2V-01-Director',
    creditModelName: 'T2V-01-Director',
    generationType: 'video',
    provider: 'minimax'
  },
  {
    frontendValue: 'I2V-01-Director',
    creditModelName: 'I2V-01-Director',
    generationType: 'video',
    provider: 'minimax'
  },
  {
    frontendValue: 'S2V-01',
    creditModelName: 'S2V-01',
    generationType: 'video',
    provider: 'minimax'
  },
  {
    frontendValue: 'gen4_turbo',
    creditModelName: 'Gen-4 Turbo', // Base name, duration appended dynamically
    generationType: 'video',
    provider: 'runway',
    options: {
      duration: [5, 10]
    }
  },
  {
    frontendValue: 'gen3a_turbo',
    creditModelName: 'Gen-3a Turbo', // Base name, duration appended dynamically
    generationType: 'video',
    provider: 'runway',
    options: {
      duration: [5, 10]
    }
  },
  {
    frontendValue: 'gen4_aleph',
    creditModelName: 'Gen-4 Aleph 10s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-t2v-4s',
    creditModelName: 'veo3 t2v 4s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-t2v-6s',
    creditModelName: 'veo3 t2v 6s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-t2v-8s',
    creditModelName: 'veo3 t2v 8s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-i2v-8s',
    creditModelName: 'veo3 i2v 8s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-fast-t2v-4s',
    creditModelName: 'veo3 fast t2v 4s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-fast-t2v-6s',
    creditModelName: 'veo3 fast t2v 6s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-fast-t2v-8s',
    creditModelName: 'veo3 fast t2v 8s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'veo3-fast-i2v-8s',
    creditModelName: 'veo3 fast i2v 8s',
    generationType: 'video',
    provider: 'runway'
  },
  {
    frontendValue: 'rw-veo3-8s',
    creditModelName: 'RW veo3 8s',
    generationType: 'video',
    provider: 'runway'
  },

  // MUSIC GENERATION MODELS
  {
    frontendValue: 'music-1.5',
    creditModelName: 'Music 1.5 (Up to 90s)',
    generationType: 'music',
    provider: 'minimax'
  },

  // PROMPT ENHANCER MODELS
  {
    frontendValue: 'chatgpt-prompt-enhancer',
    creditModelName: 'ChatGPT Prompt Enhancer (4o)',
    generationType: 'image', // Assuming it's used for image prompts
    provider: 'openai'
  }
];

/**
 * Get the credit model name for a frontend model value
 */
export const getCreditModelName = (frontendValue: string): string | null => {
  const mapping = MODEL_MAPPING.find(m => m.frontendValue === frontendValue);
  return mapping?.creditModelName || null;
};

/**
 * Get the full model mapping for a frontend model value
 */
export const getModelMapping = (frontendValue: string): ModelMapping | null => {
  return MODEL_MAPPING.find(m => m.frontendValue === frontendValue) || null;
};

/**
 * Build the complete credit model name with options for dynamic models
 */
export const buildCreditModelName = (
  frontendValue: string,
  options?: {
    resolution?: string;
    duration?: number;
    frameSize?: string;
  }
): string | null => {
  const mapping = getModelMapping(frontendValue);
  if (!mapping) return null;

  let modelName = mapping.creditModelName;

  // Handle MiniMax video models with resolution and duration
  if (mapping.frontendValue === 'MiniMax-Hailuo-02' && options?.resolution && options?.duration) {
    modelName = `Minimax-Hailuo-02 ${options.resolution} ${options.duration}s`;
  }
  // Handle Runway turbo models with duration
  else if ((mapping.frontendValue === 'gen4_turbo' || mapping.frontendValue === 'gen3a_turbo') && options?.duration) {
    modelName = `${mapping.creditModelName} ${options.duration}s`;
  }

  return modelName;
};

/**
 * Get all available models for a specific generation type
 */
export const getModelsByType = (generationType: 'image' | 'video' | 'music'): ModelMapping[] => {
  return MODEL_MAPPING.filter(m => m.generationType === generationType);
};

/**
 * Get all available models for a specific provider
 */
export const getModelsByProvider = (provider: string): ModelMapping[] => {
  return MODEL_MAPPING.filter(m => m.provider === provider);
};

/**
 * Validate if a frontend model value is supported
 */
export const isValidModel = (frontendValue: string): boolean => {
  return MODEL_MAPPING.some(m => m.frontendValue === frontendValue);
};

/**
 * Get the provider for a frontend model value
 */
export const getModelProvider = (frontendValue: string): string | null => {
  const mapping = getModelMapping(frontendValue);
  return mapping?.provider || null;
};
