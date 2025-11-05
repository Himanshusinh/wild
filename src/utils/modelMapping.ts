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
    creditModelName: 'replicate/bytedance/seedream-4',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'ideogram-ai/ideogram-v3',
    creditModelName: 'replicate/ideogram-ai/ideogram-v3-turbo',
    generationType: 'image',
    provider: 'replicate'
  },
  {
    frontendValue: 'ideogram-ai/ideogram-v3-quality',
    creditModelName: 'replicate/ideogram-ai/ideogram-v3-quality',
    generationType: 'image',
    provider: 'replicate'
  },
  {
    frontendValue: 'leonardoai/lucid-origin',
    creditModelName: 'replicate/leonardoai/lucid-origin',
    generationType: 'image',
    provider: 'replicate'
  },
  {
    frontendValue: 'leonardoai/phoenix-1.0',
    creditModelName: 'replicate/leonardoai/phoenix-1.0',
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
    frontendValue: 'MiniMax-Hailuo-2.3',
    creditModelName: 'Minimax-Hailuo-2.3', // Base name, resolution/duration appended dynamically
    generationType: 'video',
    provider: 'minimax',
    options: {
      resolution: ['768P', '1080P'],
      duration: [6, 10]
    }
  },
  {
    frontendValue: 'MiniMax-Hailuo-2.3-Fast',
    creditModelName: 'Minimax-Hailuo-2.3 Fast', // Base name, resolution/duration appended dynamically
    generationType: 'video',
    provider: 'minimax',
    options: {
      resolution: ['768P', '1080P'],
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
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-t2v-6s',
    creditModelName: 'veo3 t2v 6s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-t2v-8s',
    creditModelName: 'veo3 t2v 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-i2v-8s',
    creditModelName: 'veo3 i2v 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-fast-t2v-4s',
    creditModelName: 'veo3 fast t2v 4s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-fast-t2v-6s',
    creditModelName: 'veo3 fast t2v 6s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-fast-t2v-8s',
    creditModelName: 'veo3 fast t2v 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3-fast-i2v-8s',
    creditModelName: 'veo3 fast i2v 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'rw-veo3-8s',
    creditModelName: 'RW veo3 8s',
    generationType: 'video',
    provider: 'runway'
  },
  // Veo 3.1 Models (FAL)
  {
    frontendValue: 'veo3.1-t2v-4s',
    creditModelName: 'Veo 3.1 T2V 4s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-t2v-6s',
    creditModelName: 'Veo 3.1 T2V 6s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-t2v-8s',
    creditModelName: 'Veo 3.1 T2V 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-i2v-8s',
    creditModelName: 'Veo 3.1 I2V 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-fast-t2v-4s',
    creditModelName: 'Veo 3.1 Fast T2V 4s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-fast-t2v-6s',
    creditModelName: 'Veo 3.1 Fast T2V 6s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-fast-t2v-8s',
    creditModelName: 'Veo 3.1 Fast T2V 8s',
    generationType: 'video',
    provider: 'fal'
  },
  {
    frontendValue: 'veo3.1-fast-i2v-8s',
    creditModelName: 'Veo 3.1 Fast I2V 8s',
    generationType: 'video',
    provider: 'fal'
  },
  
  // WAN 2.5 Standard Models
  {
    frontendValue: 'wan-2.5-t2v',
    creditModelName: 'Wan 2.5 T2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['480p', '720p', '1080p'],
      duration: [5, 10]
    }
  },
  {
    frontendValue: 'wan-2.5-i2v',
    creditModelName: 'Wan 2.5 I2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['480p', '720p', '1080p'],
      duration: [5, 10]
    }
  },
  
  // Kling Models (Replicate)
  {
    frontendValue: 'kling-v2.5-turbo-pro-t2v',
    creditModelName: 'Kling 2.5 Turbo Pro T2V',
    generationType: 'video',
    provider: 'replicate',
    options: { duration: [5, 10] }
  },
  {
    frontendValue: 'kling-v2.5-turbo-pro-i2v',
    creditModelName: 'Kling 2.5 Turbo Pro I2V',
    generationType: 'video',
    provider: 'replicate',
    options: { duration: [5, 10] }
  },
  {
    frontendValue: 'kling-v2.1-t2v',
    creditModelName: 'Kling 2.1 T2V',
    generationType: 'video',
    provider: 'replicate',
    options: { duration: [5, 10] }
  },
  {
    frontendValue: 'kling-v2.1-i2v',
    creditModelName: 'Kling 2.1 I2V',
    generationType: 'video',
    provider: 'replicate',
    options: { duration: [5, 10] }
  },
  {
    frontendValue: 'kling-v2.1-master-i2v',
    creditModelName: 'Kling 2.1 Master I2V',
    generationType: 'video',
    provider: 'replicate',
    options: { duration: [5, 10] }
  },
  
  // WAN 2.5 Fast Models
  {
    frontendValue: 'wan-2.5-t2v-fast',
    creditModelName: 'Wan 2.5 Fast T2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['720p', '1080p'],
      duration: [5, 10]
    }
  },
  {
    frontendValue: 'wan-2.5-i2v-fast',
    creditModelName: 'Wan 2.5 Fast I2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['720p', '1080p'],
      duration: [5, 10]
    }
  },

  // Seedance Models (Replicate)
  {
    frontendValue: 'seedance-1.0-pro-t2v',
    creditModelName: 'Seedance 1.0 Pro T2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['480p', '720p', '1080p'],
      duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
  },
  {
    frontendValue: 'seedance-1.0-pro-i2v',
    creditModelName: 'Seedance 1.0 Pro I2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['480p', '720p', '1080p'],
      duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
  },
  {
    frontendValue: 'seedance-1.0-lite-t2v',
    creditModelName: 'Seedance 1.0 Lite T2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['480p', '720p', '1080p'],
      duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
  },
  {
    frontendValue: 'seedance-1.0-lite-i2v',
    creditModelName: 'Seedance 1.0 Lite I2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['480p', '720p', '1080p'],
      duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
  },

  // PixVerse Models (Replicate)
  {
    frontendValue: 'pixverse-v5-t2v',
    creditModelName: 'PixVerse 5 T2V', // Base name, duration and quality appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['360p', '540p', '720p', '1080p'],
      duration: [5, 8]
    }
  },
  {
    frontendValue: 'pixverse-v5-i2v',
    creditModelName: 'PixVerse 5 I2V', // Base name, duration and quality appended dynamically
    generationType: 'video',
    provider: 'replicate',
    options: {
      resolution: ['360p', '540p', '720p', '1080p'],
      duration: [5, 8]
    }
  },

  // Sora 2 Models (FAL)
  {
    frontendValue: 'sora2-t2v',
    creditModelName: 'Sora 2 T2V', // Base name, duration appended dynamically (always 720p)
    generationType: 'video',
    provider: 'fal',
    options: {
      resolution: ['720p'],
      duration: [4, 8, 12]
    }
  },
  {
    frontendValue: 'sora2-pro-t2v',
    creditModelName: 'Sora 2 Pro T2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'fal',
    options: {
      resolution: ['720p', '1080p'],
      duration: [4, 8, 12]
    }
  },
  {
    frontendValue: 'sora2-i2v',
    creditModelName: 'Sora 2 I2V', // Base name, duration appended dynamically (auto/720p)
    generationType: 'video',
    provider: 'fal',
    options: {
      resolution: ['auto', '720p'],
      duration: [4, 8, 12]
    }
  },
  {
    frontendValue: 'sora2-pro-i2v',
    creditModelName: 'Sora 2 Pro I2V', // Base name, duration and resolution appended dynamically
    generationType: 'video',
    provider: 'fal',
    options: {
      resolution: ['auto', '720p', '1080p'],
      duration: [4, 8, 12]
    }
  },
  {
    frontendValue: 'sora2-v2v-remix',
    creditModelName: 'Sora 2 V2V Remix', // Uses source video's duration and resolution
    generationType: 'video',
    provider: 'fal'
  },

  // LTX V2 (FAL)
  {
    frontendValue: 'ltx2-pro-t2v',
    creditModelName: 'LTX V2 Pro T2V', // priced dynamically via getCreditsForModel
    generationType: 'video',
    provider: 'fal',
    options: { resolution: ['1080p','1440p','2160p'], duration: [6,8,10] }
  },
  {
    frontendValue: 'ltx2-fast-t2v',
    creditModelName: 'LTX V2 Fast T2V',
    generationType: 'video',
    provider: 'fal',
    options: { resolution: ['1080p','1440p','2160p'], duration: [6,8,10] }
  },
  {
    frontendValue: 'ltx2-pro-i2v',
    creditModelName: 'LTX V2 Pro I2V',
    generationType: 'video',
    provider: 'fal',
    options: { resolution: ['1080p','1440p','2160p'], duration: [6,8,10] }
  },
  {
    frontendValue: 'ltx2-fast-i2v',
    creditModelName: 'LTX V2 Fast I2V',
    generationType: 'video',
    provider: 'fal',
    options: { resolution: ['1080p','1440p','2160p'], duration: [6,8,10] }
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
  ,
  // IMAGE UTILITIES (FAL)
  {
    frontendValue: 'fal-image2svg',
    creditModelName: 'fal-ai/image2svg',
    generationType: 'image',
    provider: 'fal'
  },
  {
    frontendValue: 'fal-recraft-vectorize',
    creditModelName: 'fal-ai/recraft/vectorize',
    generationType: 'image',
    provider: 'fal'
  }
  ,
  // Topaz Image Upscaler (dynamic per-MP pricing; display handled as dynamic)
  {
    frontendValue: 'fal-topaz-upscale-image',
    creditModelName: 'fal-ai/topaz/upscale/image',
    generationType: 'image',
    provider: 'fal'
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
  // Handle MiniMax 2.3 Standard
  else if (mapping.frontendValue === 'MiniMax-Hailuo-2.3' && options?.resolution && options?.duration) {
    modelName = `Minimax-Hailuo-2.3 ${options.resolution} ${options.duration}s`;
  }
  // Handle MiniMax 2.3 Fast
  else if (mapping.frontendValue === 'MiniMax-Hailuo-2.3-Fast' && options?.resolution && options?.duration) {
    modelName = `Minimax-Hailuo-2.3 Fast ${options.resolution} ${options.duration}s`;
  }
  // Handle Runway turbo models with duration
  else if ((mapping.frontendValue === 'gen4_turbo' || mapping.frontendValue === 'gen3a_turbo') && options?.duration) {
    modelName = `${mapping.creditModelName} ${options.duration}s`;
  }
  // Handle WAN 2.5 models with duration and resolution
  else if (mapping.frontendValue.includes('wan-2.5') && options?.duration && options?.resolution) {
    const isFast = mapping.frontendValue.includes('fast');
    const isI2V = mapping.frontendValue.includes('i2v');
    const modelType = isI2V ? 'I2V' : 'T2V';
    const speedPrefix = isFast ? 'Fast ' : '';
    modelName = `Wan 2.5 ${speedPrefix}${modelType} ${options.duration}s ${options.resolution}`;
  }
  // Handle Kling models
  else if (mapping.frontendValue.startsWith('kling') && options?.duration) {
    const d = options.duration;
    if (mapping.frontendValue.includes('v2.5') && mapping.frontendValue.includes('t2v')) {
      modelName = `Kling 2.5 Turbo Pro T2V ${d}s`;
    } else if (mapping.frontendValue.includes('v2.5') && mapping.frontendValue.includes('i2v')) {
      modelName = `Kling 2.5 Turbo Pro I2V ${d}s`;
    } else if (mapping.frontendValue.includes('v2.1') && mapping.frontendValue.includes('t2v')) {
      const res = (options?.resolution || '').toLowerCase().includes('1080') ? '1080p' : '720p';
      modelName = `Kling 2.1 T2V ${d}s ${res}`;
    } else if (mapping.frontendValue.includes('v2.1') && mapping.frontendValue.includes('i2v')) {
      if (mapping.frontendValue.includes('master')) {
        // Master variants in credit table do NOT include resolution suffix
        modelName = `Kling 2.1 Master I2V ${d}s`;
      } else {
        const res = (options?.resolution || '').toLowerCase().includes('1080') ? '1080p' : '720p';
        modelName = `Kling 2.1 I2V ${d}s ${res}`;
      }
    }
  }
  // Handle Seedance models
  else if (mapping.frontendValue.includes('seedance') && options?.duration && options?.resolution) {
    const d = options.duration;
    const res = String(options.resolution).toLowerCase();
    const resNormalized = res.includes('480') ? '480p' : res.includes('720') ? '720p' : '1080p';
    // Map duration: 2-6s -> 5s, 7-12s -> 10s for pricing
    const durForPricing = (d >= 2 && d <= 6) ? 5 : (d >= 7 && d <= 12) ? 10 : 5;
    const tier = mapping.frontendValue.includes('lite') ? 'Lite' : 'Pro';
    const mode = mapping.frontendValue.includes('i2v') ? 'I2V' : 'T2V';
    modelName = `Seedance 1.0 ${tier} ${mode} ${durForPricing}s ${resNormalized}`;
  }
  // Handle PixVerse models
  else if (mapping.frontendValue.includes('pixverse') && options?.duration && options?.resolution) {
    const d = options.duration;
    const qual = String(options.resolution).toLowerCase();
    // Normalize quality: 360p, 540p, 720p, 1080p
    const qualNormalized = qual.includes('360') ? '360p' : qual.includes('540') ? '540p' : qual.includes('720') ? '720p' : '1080p';
    // Duration: 5 or 8 seconds
    const durForPricing = (d === 5 || d === 8) ? d : 5;
    const mode = mapping.frontendValue.includes('i2v') ? 'I2V' : 'T2V';
    modelName = `PixVerse 5 ${mode} ${durForPricing}s ${qualNormalized}`;
  }
  // Handle Sora 2 models
  else if (mapping.frontendValue.includes('sora2')) {
    const isPro = mapping.frontendValue.includes('pro');
    const isV2V = mapping.frontendValue.includes('v2v');
    const isI2V = mapping.frontendValue.includes('i2v');
    
    if (isV2V) {
      // V2V Remix uses source video's duration and resolution (handled by backend)
      // No duration/resolution needed for credit model name
      modelName = `Sora 2 V2V Remix`;
    } else if (options?.duration) {
      // T2V and I2V models require duration
      const d = options.duration;
      const mode = isI2V ? 'I2V' : 'T2V';
      if (isPro && options?.resolution) {
        // Pro models: include resolution
        const res = String(options.resolution).toLowerCase().includes('1080') ? '1080p' : '720p';
        modelName = `Sora 2 Pro ${mode} ${d}s ${res}`;
      } else {
        // Standard models: only duration (always 720p)
        modelName = `Sora 2 ${mode} ${d}s`;
      }
    }
    // If T2V/I2V without duration, return base name (shouldn't happen normally)
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
