import { creditDistributionData } from './creditDistribution';

// Direct mapping between dropdown model values and their credit costs
export const MODEL_CREDITS_MAPPING: Record<string, number> = {
  // Image Generation Models
  'flux-kontext-pro': 100,      // FLUX.1 Kontext [pro]
  'flux-kontext-max': 180,      // FLUX.1 Kontext [max]
  'flux-pro-1.1': 110,          // FLUX 1.1 [pro]
  'flux-pro-1.1-ultra': 140,    // FLUX 1.1 [pro] Ultra
  'flux-pro': 130,              // FLUX.1 [pro]
  'flux-dev': 90,               // FLUX.1 [dev]
  'gen4_image': 180,            // Runway Gen 4 Image 720p (updated to 180 credits)
  'gen4_image_1080p': 180,      // Runway Gen 4 Image 1080p
  'gen4_image_turbo': 60,       // Runway Gen 4 Image Turbo
  'minimax-image-01': 17,       // Minimax Image-01 (17 credits per creditDistribution)
  'gemini-25-flash-image': 98,  // Google nano banana (T2I)
  'gemini-25-flash-image-i2i': 98,  // Google nano banana (I2I)
  'google/nano-banana-pro': 320, // Google nano banana pro (default 1K/2K - 320 credits, 4K - 620 credits)
  'seedream-v4': 80,
  'seedream-v4.5': 100, // Bytedance Seedream-4.5 (2K/4K same credit)
  'ideogram-ai/ideogram-v3': 80,
  'ideogram-ai/ideogram-v3-quality': 200,
  'ideogram-3-turbo': 80,       // Ideogram 3 Turbo
  // Imagen 4 family (FAL/Google)
  'imagen-4-ultra': 140,
  'imagen-4': 100,
  'imagen-4-fast': 60,  // Fixed: was 44, should be 60 per creditDistribution
  'flux-2-pro': 80, // Default to 1K (80 credits), will be resolved based on resolution
  'flux-2-pro-1080p': 80,      // FLUX.2 [pro] 1080p
  'flux-2-pro-2k': 160,        // FLUX.2 [pro] 2K
  'z-image-turbo': 26,         // Z Image Turbo
  'leonardoai/lucid-origin': 173,
  'leonardoai/phoenix-1.0': 170,
  // Google Nano Banana (used by erase/replace in Edit Image)
  'google_nano_banana': 98,
  // Z-Image Turbo: Free (0 credits) for launch offer
  'new-turbo-model': 0, // Free unlimited image generation
  // Product Generation Models
  'flux-krea': 130,             // Similar to FLUX.1 [pro]
  'flux-kontext-dev': 90,       // Similar to FLUX.1 [dev]

  // Video Generation Models - Default durations
  'gen4_turbo': 520,            // Gen-4 Turbo 5s (default)
  'gen3a_turbo': 520,           // Gen-3a Turbo 5s (default)
  'gen4_aleph': 360,            // Gen-4 Aleph 1s (creditDistribution shows 1s variant)
  'minimax-hailuo-01': 220,     // Minimax-Hailuo-01 512P 6s
  'MiniMax-Hailuo-02': 320,     // Minimax-Hailuo-02 512P 6s (legacy default)
  'T2V-01-Director': 980,       // T2V-01-Director
  'I2V-01-Director': 980,       // I2V-01-Director
  'S2V-01': 1420,               // S2V-01

  // Music Generation Models
  'minimax-music-2': 80,        // MiniMax Music 2 (60 credits per creditDistribution.ts)
  'minimax-music-2 10min': 160,   // MinMax Music 2.0 5minutes (80 credits per creditDistribution.ts)
  'elevenlabs-tts': 220,        // Elevenlabs Eleven v3 TTS 1000 Characters (220 credits per creditDistribution.ts - default to 1000 chars)
  'elevenlabs-tts-1000': 220,   // Elevenlabs Eleven v3 TTS 1000 Characters (220 credits per creditDistribution.ts)
  'elevenlabs-tts-2000': 420,   // Elevenlabs Eleven v3 TTS 2000 Characters (420 credits per creditDistribution.ts)
  'chatterbox-multilingual': 70, // Chatter Box Multilingual 1000 Characters (70 credits per creditDistribution.ts)
  'chatterbox-multilingual-1000': 70, // Chatter Box Multilingual 1000 Characters (70 credits per creditDistribution.ts)
  'maya-tts': 6,                 // Maya TTS (6 credits per second - actual cost calculated dynamically based on audio duration)
  'elevenlabs-dialogue': 220,    // Elevenlabs Eleven v3 TTD 1000 Characters (220 credits per creditDistribution.ts - default to 1000 chars, same as TTS)
  'elevenlabs-dialogue-1000': 220,   // Elevenlabs Eleven v3 TTD 1000 Characters (220 credits per creditDistribution.ts)
  'elevenlabs-dialogue-2000': 420, // Elevenlabs Eleven v3 TTD 2000 Characters (420 credits per creditDistribution.ts)
  'elevenlabs-sfx': 6,          // Elevenlabs Sound-Effects v2 1s (24 credits per creditDistribution.ts)

  // Ad Generation Models (same as image generation)
  'flux-kontext-pro-ad': 110,
  'flux-kontext-max-ad': 190,

  // Video models with duration and resolution variants
  // Minimax-Hailuo-02 variants
  'MiniMax-Hailuo-02-512P-6s': 220,
  'MiniMax-Hailuo-02-512P-10s': 320,
  'MiniMax-Hailuo-02-768P-6s': 580,
  'MiniMax-Hailuo-02-768P-10s': 1140,
  'MiniMax-Hailuo-02-1080P-6s': 1000,

  // Minimax-Hailuo-2.3 Fast variants
  'MiniMax-Hailuo-2.3-Fast-768P-6s': 460,
  'MiniMax-Hailuo-2.3-Fast-768P-10s': 720,
  'MiniMax-Hailuo-2.3-Fast-1080P-6s': 740,

  // Minimax-Hailuo-2.3 Standard variants
  'MiniMax-Hailuo-2.3-768P-6s': 640,
  'MiniMax-Hailuo-2.3-768P-10s': 1200,
  'MiniMax-Hailuo-2.3-1080P-6s': 1060,

  // Gen-4 Turbo variants
  'gen4_turbo-5s': 520,
  'gen4_turbo-10s': 1020,

  // Gen-3a Turbo variants
  'gen3a_turbo-5s': 520,
  'gen3a_turbo-10s': 1020,

  // Veo3 models
  'veo3-t2v-4s': 3260,
  'veo3-t2v-6s': 4860,
  'veo3-t2v-8s': 6460,
  'veo3-i2v-8s': 6460,
  'veo3-fast-t2v-4s': 1260,
  'veo3-fast-t2v-6s': 1860,
  'veo3-fast-t2v-8s': 2460,
  'veo3-fast-i2v-8s': 2460,
  'RW-veo3-8s': 6460,

  // Veo 3.1 models (AUDIO ON - default)
  'veo3.1-t2v-4s': 3260,
  'veo3.1-t2v-6s': 4860,
  'veo3.1-t2v-8s': 6460,
  'veo3.1-i2v-4s': 3260,
  'veo3.1-i2v-6s': 4860,
  'veo3.1-i2v-8s': 6460,
  'veo3.1-fast-t2v-4s': 1260,
  'veo3.1-fast-t2v-6s': 1860,
  'veo3.1-fast-t2v-8s': 2460,
  'veo3.1-fast-i2v-4s': 1260,
  'veo3.1-fast-i2v-6s': 1860,
  'veo3.1-fast-i2v-8s': 2460,
  // Veo 3.1 models (AUDIO OFF)
  'veo3.1-t2v-4s-audio-off': 1660,
  'veo3.1-t2v-6s-audio-off': 2460,
  'veo3.1-t2v-8s-audio-off': 3260,
  'veo3.1-i2v-4s-audio-off': 1660,
  'veo3.1-i2v-6s-audio-off': 2460,
  'veo3.1-i2v-8s-audio-off': 3260,
  'veo3.1-fast-t2v-4s-audio-off': 860,
  'veo3.1-fast-t2v-6s-audio-off': 1260,
  'veo3.1-fast-t2v-8s-audio-off': 1660,
  'veo3.1-fast-i2v-4s-audio-off': 860,
  'veo3.1-fast-i2v-6s-audio-off': 1260,
  'veo3.1-fast-i2v-8s-audio-off': 1660,

  // WAN 2.5 Standard T2V (updated per provided sheet)
  'wan-2.5-t2v-5s-480p': 480,
  'wan-2.5-t2v-5s-720p': 900,
  'wan-2.5-t2v-5s-1080p': 1460,
  'wan-2.5-t2v-10s-480p': 900,
  'wan-2.5-t2v-10s-720p': 1740,
  'wan-2.5-t2v-10s-1080p': 2860,

  // WAN 2.5 Standard I2V (updated per provided sheet)
  'wan-2.5-i2v-5s-480p': 480,
  'wan-2.5-i2v-5s-720p': 900,
  'wan-2.5-i2v-5s-1080p': 1460,
  'wan-2.5-i2v-10s-480p': 900,
  'wan-2.5-i2v-10s-720p': 1740,
  'wan-2.5-i2v-10s-1080p': 2860,

  // WAN 2.5 Fast T2V (updated per provided sheet)
  'wan-2.5-fast-t2v-5s-720p': 740,
  'wan-2.5-fast-t2v-5s-1080p': 1080,
  'wan-2.5-fast-t2v-10s-720p': 1420,
  'wan-2.5-fast-t2v-10s-1080p': 2100,

  // WAN 2.5 Fast I2V (updated per provided sheet)
  'wan-2.5-fast-i2v-5s-720p': 740,
  'wan-2.5-fast-i2v-5s-1080p': 1080,
  'wan-2.5-fast-i2v-10s-720p': 1420,
  'wan-2.5-fast-i2v-10s-1080p': 2100,

  // Kling credit SKUs (map to distribution names)
  'kling-v2.5-turbo-pro-t2v-5s': 760,
  'kling-v2.5-turbo-pro-t2v-10s': 1460,
  'kling-v2.5-turbo-pro-i2v-5s': 760,
  'kling-v2.5-turbo-pro-i2v-10s': 1460,
  'kling-v2.1-master-t2v-5s': 2920,
  'kling-v2.1-master-t2v-10s': 5720,
  'kling-v2.1-master-i2v-5s': 2920,
  'kling-v2.1-master-i2v-10s': 5720,
  // Kling 2.1 (non-master) – supports only I2V; align T2V keys to I2V pricing to avoid mismatches
  'kling-v2.1-t2v-5s-720p': 560,
  'kling-v2.1-t2v-5s-1080p': 960,
  'kling-v2.1-t2v-10s-720p': 1060,
  'kling-v2.1-t2v-10s-1080p': 1860,
  'kling-v2.1-i2v-5s-720p': 560,
  'kling-v2.1-i2v-5s-1080p': 960,
  'kling-v2.1-i2v-10s-720p': 1060,
  'kling-v2.1-i2v-10s-1080p': 1860,

  // Seedance 1.0 Pro T2V/I2V (duration mapped: 2-6s -> 5s, 7-12s -> 10s)
  'seedance-1.0-pro-t2v-5s-480p': 360,
  'seedance-1.0-pro-t2v-5s-720p': 660,
  'seedance-1.0-pro-t2v-5s-1080p': 1560,
  'seedance-1.0-pro-t2v-10s-480p': 660,
  'seedance-1.0-pro-t2v-10s-720p': 1260,
  'seedance-1.0-pro-t2v-10s-1080p': 3060,
  'seedance-1.0-pro-i2v-5s-480p': 360,
  'seedance-1.0-pro-i2v-5s-720p': 660,
  'seedance-1.0-pro-i2v-5s-1080p': 1560,
  'seedance-1.0-pro-i2v-10s-480p': 660,
  'seedance-1.0-pro-i2v-10s-720p': 1260,
  'seedance-1.0-pro-i2v-10s-1080p': 3060,

  // Seedance 1.0 Lite T2V/I2V (duration mapped: 2-6s -> 5s, 7-12s -> 10s)
  'seedance-1.0-lite-t2v-5s-480p': 200,
  'seedance-1.0-lite-t2v-5s-720p': 380,
  'seedance-1.0-lite-t2v-5s-1080p': 740,
  'seedance-1.0-lite-t2v-10s-480p': 380,
  'seedance-1.0-lite-t2v-10s-720p': 740,
  'seedance-1.0-lite-t2v-10s-1080p': 1460,
  'seedance-1.0-lite-i2v-5s-480p': 200,
  'seedance-1.0-lite-i2v-5s-720p': 380,
  'seedance-1.0-lite-i2v-5s-1080p': 740,
  'seedance-1.0-lite-i2v-10s-480p': 380,
  'seedance-1.0-lite-i2v-10s-720p': 740,
  'seedance-1.0-lite-i2v-10s-1080p': 1460,

  // PixVerse 5 T2V/I2V (duration: 5s or 8s)
  'pixverse-v5-t2v-5s-360p': 660,
  'pixverse-v5-t2v-5s-540p': 660,
  'pixverse-v5-t2v-5s-720p': 860,
  'pixverse-v5-t2v-5s-1080p': 1660,
  'pixverse-v5-t2v-8s-360p': 1260,
  'pixverse-v5-t2v-8s-540p': 1260,
  'pixverse-v5-t2v-8s-720p': 1660,
  'pixverse-v5-t2v-8s-1080p': 3260,
  'pixverse-v5-i2v-5s-360p': 660,
  'pixverse-v5-i2v-5s-540p': 660,
  'pixverse-v5-i2v-5s-720p': 860,
  'pixverse-v5-i2v-5s-1080p': 1660,
  'pixverse-v5-i2v-8s-360p': 1260,
  'pixverse-v5-i2v-8s-540p': 1260,
  'pixverse-v5-i2v-8s-720p': 1660,
  'pixverse-v5-i2v-8s-1080p': 3260,

  // Sora 2 Standard (T2V/I2V)
  'sora2-t2v-4s': 860,
  'sora2-t2v-8s': 1660,
  'sora2-t2v-12s': 2460,
  'sora2-i2v-4s': 860,
  'sora2-i2v-8s': 1660,
  'sora2-i2v-12s': 2460,

  // Sora 2 Pro (T2V/I2V) - 720p
  'sora2-pro-t2v-4s-720p': 2460,
  'sora2-pro-t2v-8s-720p': 4860,
  'sora2-pro-t2v-12s-720p': 7260,
  'sora2-pro-i2v-4s-720p': 2460,
  'sora2-pro-i2v-8s-720p': 4860,
  'sora2-pro-i2v-12s-720p': 7260,

  // Sora 2 Pro (T2V/I2V) - 1080p
  'sora2-pro-t2v-4s-1080p': 4060,
  'sora2-pro-t2v-8s-1080p': 8060,
  'sora2-pro-t2v-12s-1080p': 12060,
  'sora2-pro-i2v-4s-1080p': 4060,
  'sora2-pro-i2v-8s-1080p': 8060,
  'sora2-pro-i2v-12s-1080p': 12060,

  // SeedVR2 models (duration and resolution variants)
  'seedvr2-5s-720p': 1060,
  'seedvr2-5s-1080p': 3060,
  'seedvr2-5s-2k': 6060,
  'seedvr2-10s-720p': 2060,
  'seedvr2-10s-1080p': 6060,
  'seedvr2-10s-2k': 12060,

  // Image Utility Models
  'fal-image2svg': 30,          // Image to SVG
  'fal-recraft-vectorize': 40,  // Recraft Vectorize
  'fal-outpaint': 70,            // fal-ai/outpaint
  'fal-bria-genfill': 100,       // fal-ai/bria/genfill
  'fal-topaz-upscale-24mp': 180, // fal-ai/topaz/upscale/image 24MP
  'fal-topaz-upscale-48mp': 340, // fal-ai/topaz/upscale/image 48MP
  'fal-topaz-upscale-96mp': 660, // fal-ai/topaz/upscale/image 96MP
  'fal-topaz-upscale-512mp': 2740, // fal-ai/topaz/upscale/image 512MP
  'replicate-magic-image-refiner': 84, // replicate/fermatresearch/magic-image-refiner
  'replicate-clarity-upscaler': 62,   // replicate/philz1337x/clarity-upscaler
  // Background removal (Replicate) - align with creditDistribution (10 credits)
  'replicate-lucataco-remove-bg': 10,  // Lucataco/remove-bg
  'replicate-851-labs-remove-bg': 10,  // 851-labs/background-remover
  'replicate-bria-expand-image': 100, // replicate/bria/expand-image
  'replicate-real-esrgan': 32,         // replicate/nightmareai/real-esrgan (32.4 rounded)
  'replicate-swin2sr': 43,             // replicate/mv-lab/swin2sr
  // Crystal Upscaler variants
  'replicate-crystal-upscaler-1080p': 220,
  'replicate-crystal-upscaler-1440p': 420,
  'replicate-crystal-upscaler-2160p': 820,
  'replicate-crystal-upscaler-6k': 1620,
  'replicate-crystal-upscaler-8k': 3220,
  'replicate-crystal-upscaler-12k': 6420,
};

// Function to get credit cost for a model
export const getCreditsForModel = (modelValue: string, duration?: string, resolution?: string, generateAudio?: boolean, uploadedImages?: any[]): number | null => {
  // Handle special cases for video models with duration and resolution
  if (modelValue === 'MiniMax-Hailuo-02' && duration && resolution) {
    const durationNum = parseInt(duration.replace('s', ''));
    const resolutionP = resolution.replace('P', 'P');
    const key = `MiniMax-Hailuo-02-${resolutionP}-${durationNum}s`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // MiniMax-Hailuo-2.3 Standard and Fast
  if ((modelValue === 'MiniMax-Hailuo-2.3' || modelValue === 'MiniMax-Hailuo-2.3-Fast') && duration && resolution) {
    const durationNum = parseInt(duration.replace('s', ''));
    const resolutionP = resolution.replace('P', 'P');
    const fastPart = modelValue === 'MiniMax-Hailuo-2.3-Fast' ? 'Fast-' : '';
    const key = `MiniMax-Hailuo-2.3-${fastPart}${resolutionP}-${durationNum}s`;
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

  // Handle veo3.1 models (check before veo3)
  if (modelValue.includes('veo3.1')) {
    const isFast = modelValue.includes('fast');
    const isI2V = modelValue.includes('i2v') || modelValue.includes('first-last-frame-to-video');
    const modelType = isI2V ? 'i2v' : 't2v';
    const audioSuffix = (generateAudio === false) ? '-audio-off' : '';

    if (isFast) {
      if (duration === '4s') {
        const key = `veo3.1-fast-${modelType}-4s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === '6s') {
        const key = `veo3.1-fast-${modelType}-6s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === '8s') {
        const key = `veo3.1-fast-${modelType}-8s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      }
    } else {
      if (duration === '4s') {
        const key = `veo3.1-${modelType}-4s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === '6s') {
        const key = `veo3.1-${modelType}-6s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      } else if (duration === '8s') {
        const key = `veo3.1-${modelType}-8s${audioSuffix}`;
        return MODEL_CREDITS_MAPPING[key] || null;
      }
    }
  }

  // Handle veo3 models (check after veo3.1 to avoid conflicts)
  if (modelValue.includes('veo3') && !modelValue.includes('veo3.1')) {
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

  // Handle WAN 2.5 models
  if (modelValue.includes('wan-2.5')) {
    const isFast = modelValue.includes('fast');
    const isI2V = modelValue.includes('i2v');
    const modelType = isI2V ? 'i2v' : 't2v';
    const speedPrefix = isFast ? 'fast-' : '';

    // Map resolution to our format
    let resolutionKey = '';
    if (resolution?.includes('480')) resolutionKey = '480p';
    else if (resolution?.includes('720')) resolutionKey = '720p';
    else if (resolution?.includes('1080')) resolutionKey = '1080p';

    // Map duration to our format
    const durationNum = duration ? parseInt(duration.replace('s', '')) : 5;

    const key = `wan-2.5-${speedPrefix}${modelType}-${durationNum}s-${resolutionKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle Kling models
  if (modelValue.startsWith('kling')) {
    // v2.5 Turbo Pro: only duration matters
    if (modelValue.includes('v2.5')) {
      const isI2V = modelValue.includes('i2v');
      const kind = isI2V ? 'i2v' : 't2v';
      const d = duration ? parseInt(String(duration).replace('s', '')) : 5;
      const key = `kling-v2.5-turbo-pro-${kind}-${d}s`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
    // v2.1: duration and resolution
    const isI2V = modelValue.includes('i2v');
    const kind = isI2V ? 'i2v' : 't2v';
    const d = duration ? parseInt(String(duration).replace('s', '')) : 5;
    const res = (resolution || '').toLowerCase().includes('1080') ? '1080p' : '720p';
    const master = modelValue.includes('master');
    if (master) {
      const key = `kling-v2.1-master-${kind}-${d}s`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
    const key = `kling-v2.1-${kind}-${d}s-${res}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle Seedance models
  if (modelValue.includes('seedance')) {
    const isI2V = modelValue.includes('i2v');
    const modelType = isI2V ? 'i2v' : 't2v';
    const tier = modelValue.includes('lite') ? 'lite' : 'pro';

    // Map resolution
    let resolutionKey = '';
    if (resolution?.includes('480')) resolutionKey = '480p';
    else if (resolution?.includes('720')) resolutionKey = '720p';
    else if (resolution?.includes('1080')) resolutionKey = '1080p';

    // Map duration: 2-6s -> 5s, 7-12s -> 10s for pricing
    const durationNum = duration ? parseInt(String(duration).replace('s', '')) : 5;
    const durForPricing = (durationNum >= 2 && durationNum <= 6) ? 5 : (durationNum >= 7 && durationNum <= 12) ? 10 : 5;

    const key = `seedance-1.0-${tier}-${modelType}-${durForPricing}s-${resolutionKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle PixVerse models
  if (modelValue.includes('pixverse')) {
    const isI2V = modelValue.includes('i2v');
    const modelType = isI2V ? 'i2v' : 't2v';

    // Map quality/resolution: 360p, 540p, 720p, 1080p
    let qualityKey = '';
    if (resolution?.includes('360')) qualityKey = '360p';
    else if (resolution?.includes('540')) qualityKey = '540p';
    else if (resolution?.includes('720')) qualityKey = '720p';
    else if (resolution?.includes('1080')) qualityKey = '1080p';
    else qualityKey = '720p'; // Default

    // Duration: 5 or 8 seconds
    const durationNum = duration ? parseInt(String(duration).replace('s', '')) : 5;
    const durForPricing = (durationNum === 5 || durationNum === 8) ? durationNum : 5;

    const key = `pixverse-v5-${modelType}-${durForPricing}s-${qualityKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle LTX V2 models (Pro/Fast, T2V/I2V) with duration and resolution
  if (modelValue.includes('ltx2')) {
    const isPro = modelValue.includes('pro');
    const res = (resolution || '1080p').toLowerCase();
    const durNum = duration ? parseInt(String(duration).replace('s', '')) : 6;
    // Pricing table (credits) based on user's provided chart
    const table: Record<'pro' | 'fast', Record<'1080p' | '1440p' | '2160p', Record<6 | 8 | 10, number>>> = {
      pro: {
        '1080p': { 6: 780, 8: 1020, 10: 1260 },
        '1440p': { 6: 1500, 8: 1980, 10: 2460 },
        '2160p': { 6: 2940, 8: 3900, 10: 4860 }
      },
      fast: {
        '1080p': { 6: 540, 8: 700, 10: 860 },
        '1440p': { 6: 1020, 8: 1340, 10: 1660 },
        '2160p': { 6: 1980, 8: 2620, 10: 3260 }
      }
    };
    const tier: 'pro' | 'fast' = isPro ? 'pro' : 'fast';
    const resKey = (res.includes('1440') ? '1440p' : (res.includes('2160') || res.includes('4k') ? '2160p' : '1080p')) as '1080p' | '1440p' | '2160p';
    const d: 6 | 8 | 10 = (durNum === 8 ? 8 : (durNum === 10 ? 10 : 6));
    const cost = table[tier][resKey][d];
    return cost || null;
  }

  // Handle Sora 2 models
  if (modelValue.includes('sora2')) {
    const isPro = modelValue.includes('pro');
    const isI2V = modelValue.includes('i2v');
    const isV2V = modelValue.includes('v2v');

    // V2V Remix uses source video's parameters for pricing (handled by backend)
    // Return a default/estimated cost here to avoid "Unknown model" error
    // The actual cost will be calculated on the backend based on source video
    if (isV2V) {
      // Return an estimated default cost (8s, 720p standard as fallback)
      // The backend will use the actual source video parameters for final pricing
      return MODEL_CREDITS_MAPPING['sora2-t2v-8s'] || 1660; // Default to standard 8s cost
    }

    const modelType = isI2V ? 'i2v' : 't2v';

    // Duration: 4, 8, or 12 seconds
    const durationNum = duration ? parseInt(String(duration).replace('s', '')) : 8;
    const durForPricing = (durationNum === 4 || durationNum === 8 || durationNum === 12) ? durationNum : 8;

    if (isPro) {
      // Pro models: resolution matters (720p or 1080p)
      const res = (resolution || '').toLowerCase().includes('1080') ? '1080p' : '720p';
      const key = `sora2-pro-${modelType}-${durForPricing}s-${res}`;
      return MODEL_CREDITS_MAPPING[key] || null;
    } else {
      // Standard models: only duration matters (always 720p)
      const key = `sora2-${modelType}-${durForPricing}s`;
      return MODEL_CREDITS_MAPPING[key] || null;
    }
  }

  // Handle Flux 2 Pro with resolution and I2I/T2I
  if (modelValue === 'flux-2-pro') {
    // Check if this is I2I (image-to-image) by checking if uploadedImages are present
    const isI2I = Array.isArray(uploadedImages) && uploadedImages.length > 0;

    if (isI2I) {
      // I2I pricing: 110 credits for 1K, 190 credits for 2K
      if (resolution === '2K') {
        return 190; // Flux 2 Pro I2I 2K: 190 credits
      } else {
        return 110; // Flux 2 Pro I2I 1K: 110 credits
      }
    } else {
      // T2I pricing: 80 credits for 1K, 160 credits for 2K
      if (resolution === '2K') {
        return 160; // Flux 2 Pro T2I 2K: 160 credits
      } else {
        return 80; // Flux 2 Pro T2I 1K: 80 credits
      }
    }
  }

  // Handle FLUX.2 Pro variants
  if (modelValue === 'flux-2-pro-1080p') {
    return 80; // FLUX.2 [pro] 1080p
  }
  if (modelValue === 'flux-2-pro-2k') {
    return 160; // FLUX.2 [pro] 2K
  }

  // Handle Google nano banana pro with resolution
  if (modelValue === 'google/nano-banana-pro' && resolution) {
    if (resolution === '4K') {
      return 620; // Nano banana Pro 4K: 620 credits (per creditDistribution)
    } else if (resolution === '1K' || resolution === '2K') {
      return 320; // Nano banana Pro 1K/2K: 320 credits (per creditDistribution)
    }
    return 320; // Default to 2K (320 credits per creditDistribution)
  }

  // Handle SeedVR2 models
  if (modelValue.includes('seedvr2')) {
    const durationNum = duration ? parseInt(String(duration).replace('s', '')) : 5;
    const res = (resolution || '').toLowerCase();
    let resKey = '';
    if (res.includes('2k')) resKey = '2k';
    else if (res.includes('1080')) resKey = '1080p';
    else resKey = '720p';

    const key = `seedvr2-${durationNum}s-${resKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Handle Crystal Upscaler with resolution
  if (modelValue === 'replicate-crystal-upscaler' && resolution) {
    const res = String(resolution).toLowerCase();
    let resKey = '';
    if (res.includes('12k')) resKey = '12k';
    else if (res.includes('8k')) resKey = '8k';
    else if (res.includes('6k')) resKey = '6k';
    else if (res.includes('2160') || res.includes('4k')) resKey = '2160p';
    else if (res.includes('1440')) resKey = '1440p';
    else resKey = '1080p';

    const key = `replicate-crystal-upscaler-${resKey}`;
    return MODEL_CREDITS_MAPPING[key] || null;
  }

  // Default lookup
  return MODEL_CREDITS_MAPPING[modelValue] || null;
};

// Function to get model info for display
export const getModelCreditInfo = (modelValue: string, duration?: string, resolution?: string, generateAudio?: boolean) => {
  const credits = getCreditsForModel(modelValue, duration, resolution, generateAudio);

  // Special handling for Maya TTS and ElevenLabs SFX - show per-second pricing
  if (modelValue === 'maya-tts') {
    return {
      credits: 6, // Per second
      hasCredits: true,
      displayText: '6 credits per second'
    };
  }

  if (modelValue === 'elevenlabs-sfx') {
    return {
      credits: 6, // Per second
      hasCredits: true,
      displayText: '6 credits per second'
    };
  }

  return {
    credits,
    hasCredits: credits !== null,
    displayText: credits ? `${credits} credits` : null
  };
};

// Helper function to format model name with credits
export const formatModelWithCredits = (modelName: string, modelValue: string, duration?: string, resolution?: string, generateAudio?: boolean): string => {
  const creditInfo = getModelCreditInfo(modelValue, duration, resolution, generateAudio);

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
