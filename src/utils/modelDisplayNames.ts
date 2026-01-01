/**
 * Utility functions for mapping backend model IDs to frontend display names
 */

// Model display name mappings
const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Image Generation Models
  'gemini-25-flash-image': 'Google Nano Banana',
  'flux-kontext-pro': 'Flux Kontext Pro',
  'flux-kontext-max': 'Flux Kontext Max',
  'flux-pro-1.1': 'Flux Pro 1.1',
  'flux-pro-1.1-ultra': 'Flux Pro 1.1 Ultra',
  'flux-pro': 'FLUX.1 Pro',
  'flux-dev': 'FLUX.1 Dev',
  'gen4_image': 'Runway Gen4 Image',
  'gen4_image_turbo': 'Runway Gen4 Image Turbo',
  'minimax-image-01': 'MiniMax Image-01',
  // Background removal (show credits inline)
  'replicate-lucataco-remove-bg': 'Lucataco Remove BG - 10 credits',
  'replicate-851-labs-remove-bg': '851 Labs Remove BG - 10 credits',
  'seedream-v4': 'Seedream v4 4k',
  'seedream-4.5': 'Seedream 4.5 4K',
  'ideogram-ai/ideogram-v3': 'Ideogram v3',
  'ideogram-ai/ideogram-v3-quality': 'Ideogram v3 Quality',
  'leonardoai/lucid-origin': 'Lucid Origin',
  'leonardoai/phoenix-1.0': 'Phoenix 1.0',
  'imagen-4-ultra': 'Imagen 4 Ultra',
  'imagen-4': 'Imagen 4',
  'imagen-4-fast': 'Imagen 4 Fast',
  'new-turbo-model': 'Z-Turbo Model',
  'openai/gpt-image-1.5': 'GPT Image 1.5',
  // Qwen
  'qwen-image-edit': 'Qwen Image Edit',
  'qwen-image-edit-2511': 'Qwen Image Edit',
  'qwen-image-edit-2512': 'Qwen Image Edit',
  'qwen/qwen-image-edit-2511': 'Qwen Image Edit',
  'qwen/qwen-image-edit-2512': 'Qwen Image Edit',
  'replicate/qwen/qwen-image-edit-2511': 'Qwen Image Edit',
  'replicate/qwen/qwen-image-edit-2512': 'Qwen Image Edit',
  
  // Video Generation Models
  'veo3-t2v-8s': 'Veo3',
  'veo3-fast-t2v-8s': 'Veo3 Fast',
  'veo3.1-t2v-4s': 'Veo 3.1',
  'veo3.1-t2v-6s': 'Veo 3.1',
  'veo3.1-t2v-8s': 'Veo 3.1',
  'veo3.1-fast-t2v-4s': 'Veo 3.1 Fast',
  'veo3.1-fast-t2v-6s': 'Veo 3.1 Fast',
  'veo3.1-fast-t2v-8s': 'Veo 3.1 Fast',
  'veo3-i2v-8s': 'Veo3',
  'veo3-fast-i2v-8s': 'Veo3 Fast',
  'veo3.1-i2v-8s': 'Veo 3.1',
  'veo3.1-fast-i2v-8s': 'Veo 3.1 Fast',
  'sora2-t2v': 'Sora 2',
  'sora2-pro-t2v': 'Sora 2 Pro',
  'sora2-i2v': 'Sora 2',
  'sora2-pro-i2v': 'Sora 2 Pro',
  'sora2-v2v-remix': 'Sora 2 Remix',
  'kling-v2.5-turbo-pro-t2v': 'Kling 2.5 Turbo Pro',
  'kling-v2.1-t2v': 'Kling 2.1',
  'kling-2.6-pro': 'Kling 2.6 Pro',
  'fal-ai/kling-video/v2.6/pro/text-to-video': 'Kling 2.6 Pro',
  'fal-ai/kling-video/v2.6/pro/image-to-video': 'Kling 2.6 Pro',
  'wan-2.5-t2v': 'WAN 2.5 T2V',
  'wan-2.5-t2v-fast': 'WAN 2.5 T2V Fast',
  'MiniMax-Hailuo-2.3': 'MiniMax-Hailuo-2.3',
  'MiniMax-Hailuo-2.3-Fast': 'MiniMax-Hailuo-2.3 Fast',
  'MiniMax-Hailuo-02': 'MiniMax-Hailuo-02',
  'kling-o1': 'Kling o1',
  'kling-o1-5s': 'Kling o1',
  'kling-o1-10s': 'Kling o1',
  'fal-ai/kling-video/o1/image-to-video': 'Kling o1',
  'kling o1 5s': 'Kling o1',
  'kling o1 10s': 'Kling o1',
  'Kling o1 5s': 'Kling o1',
  'Kling o1 10s': 'Kling o1',
  'T2V-01-Director': 'T2V-01-Director',
  'kling-v2.5-turbo-pro-i2v': 'Kling 2.5 Turbo Pro',
  'kling-v2.1-i2v': 'Kling 2.1',
  'wan-2.5-i2v': 'WAN 2.5 I2V',
  'wan-2.5-i2v-fast': 'WAN 2.5 I2V Fast',
  'MiniMax-Hailuo-02-i2v': 'MiniMax-Hailuo-02',
  
  // Music Generation Models
  'musicgen-remixer': 'MusicGen Remixer',
  'musicgen-melody': 'MusicGen Melody',
  'stable-audio-open': 'Stable Audio Open',
  'stable-audio-2': 'Stable Audio 2',
  'prunaai/p-image': 'P-Image',
  'prunaai/p-image-edit': 'P-Image-Edit',
  
  // Logo Generation Models
  'flux-kontext-dev': 'Flux Kontext Dev',
  'flux-krea': 'Flux Krea',
};

/**
 * Gets the display name for a model ID
 * @param modelId - The backend model ID
 * @returns The frontend display name or the original ID if no mapping found
 */
export function getModelDisplayName(modelId: string | undefined | null): string {
  if (!modelId) return 'Unknown Model';
  
  // Normalize known provider prefixes often saved in history (e.g., "Fal Ai Veo3 Fast")
  const normalized = modelId
    .trim()
    // Handle slash-prefixed provider model IDs (e.g., "replicate/qwen/qwen-image-edit-2511")
    .replace(/^replicate\s*\//i, '')
    .replace(/^\s*(fal\s*ai)\s*/i, '')
    .replace(/^\s*(replicate)\s*/i, '')
    .replace(/^\s*(runway)\s*/i, '')
    .replace(/^\s*(minimax)\s*/i, '')
    .replace(/^\s*(kwai|kwaivgi|kuaishou|kuaigv)\s*/i, '')
    .replace(/\bkling\s*video\b/ig, 'kling')
    .replace(/\bvideo\b/ig, '')
    .replace(/\bimage\s*to\b/ig, '') // Remove "Image To" suffix
    .replace(/\btext\s*to\b/ig, '') // Remove "Text To" suffix
    .replace(/\bto\s*video\b/ig, '') // Remove "To Video" suffix
    .replace(/\bi2v\b/ig, '')
    .replace(/\bt2v\b/ig, '')
    .trim();

  // Heuristic remapping for models if provider text snuck into the model string
  const lower = normalized.toLowerCase();
  
  // Runway Act-Two model (check before other Runway models)
  if (lower.includes('act_two') || lower.includes('act-two') || lower.includes('acttwo') || 
      lower.includes('runway_act_two') || lower.includes('runway-act-two') ||
      lower.includes('character performance') && lower.includes('act two')) {
    return 'Runway Act-Two';
  }
  
  // WAN 2.2 Animate models (check before generic WAN models)
  if (lower.includes('wan-2.2-animate') || lower.includes('wan-video/wan-2.2-animate')) {
    if (lower.includes('replace')) return 'WAN Replace';
    if (lower.includes('animation')) return 'WAN Animate';
    return 'WAN Animate';
  }
  
  // Sora 2 models (check before other models)
  if (lower.includes('sora2') || lower.includes('sora-2')) {
    if (lower.includes('remix') || lower.includes('v2v')) return 'Sora 2 Remix';
    if (lower.includes('pro')) return 'Sora 2 Pro';
    return 'Sora 2';
  }
  
  // Veo 3.1 models (check before generic Veo3)
  if (lower.includes('veo3.1') || lower.includes('veo 3.1')) {
    if (lower.includes('fast')) return 'Veo 3.1 Fast';
    return 'Veo 3.1';
  }
  
  // Veo3 models (legacy)
  if (lower.includes('veo3')) {
    if (lower.includes('fast')) return 'Veo3 Fast';
    return 'Veo3';
  }

  // Heuristic remapping for WAN models (remove "Wan Video" etc.)
  if (lower.includes('wan')) {
    const isFast = /fast/i.test(normalized);
    if (lower.includes('2.5')) return `WAN 2.5${isFast ? ' Fast' : ''}`;
    if (lower.includes('2')) return `WAN 2${isFast ? ' Fast' : ''}`;
    return `WAN${isFast ? ' Fast' : ''}`;
  }

  // LTX V2 models (remove any provider prefixes and format nicely)
  if (lower.includes('ltx') || lower.includes('ltxv-2') || lower.includes('ltx2')) {
    const isFast = /fast/i.test(normalized);
    const isPro = /pro/i.test(normalized) && !isFast; // prefer Fast if both words appear
    if (isFast) return 'LTX V2 FAST';
    // Default to PRO when unspecified, per design
    return 'LTX V2 PRO';
  }

  // Heuristic remapping for Kling models (remove vendor misspellings like Kwai/Kwaivgi)
  if (lower.includes('kling')) {
    const isMaster = /master/i.test(normalized);
    if (lower.includes('o1') || lower.includes('o-1')) return 'Kling o1';
    if (lower.includes('2.6')) return 'Kling 2.6 Pro';
    if (lower.includes('2.5')) return `Kling 2.5${isMaster ? ' Master' : ''}`;
    if (lower.includes('2.1')) return `Kling 2.1${isMaster ? ' Master' : ''}`;
    return `Kling${isMaster ? ' Master' : ''}`;
  }

  // Check if we have a direct mapping
  if (MODEL_DISPLAY_NAMES[normalized]) {
    return MODEL_DISPLAY_NAMES[normalized];
  }
  
  // Fallback: try to format the model ID nicely
  return normalized
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase())
    .replace(/\//g, ' ');
}

/**
 * Gets all available model display names
 * @returns Array of { id, name } objects
 */
export function getAllModelDisplayNames(): Array<{ id: string; name: string }> {
  return Object.entries(MODEL_DISPLAY_NAMES).map(([id, name]) => ({ id, name }));
}
