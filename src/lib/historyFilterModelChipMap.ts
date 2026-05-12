/**
 * Maps human-readable chips in HistoryFilterDropdown to the `model` strings
 * persisted on generationHistory items (must match Firestore / backend filtering).
 *
 * Keep in sync with image model values in ModelsDropdown / handleGenerate.
 */

/** Quick chips shown in the filter popup (subset of FILTER_POPUP_MODEL_LABELS). */
export const FILTER_POPUP_QUICK_MODEL_LABELS = [
  "Flux Dev",
  "Nano Banana",
] as const;

/**
 * All model labels shown in the filter popup (search + chips).
 * Order is UI-only; each must have an entry in LABEL_TO_STORED below.
 */
export const FILTER_POPUP_MODEL_LABELS: readonly string[] = [
  ...FILTER_POPUP_QUICK_MODEL_LABELS,
  "Classic",
  "Flux.2 Pro",
  "Flux 2 Pro",
  "Qwen Image 2 Pro",
  "Qwen Image 2",
  "Nano Banana 2",
  "Seedream 5 Lite",
  "Nano Banana Pro",
  "z-image-turbo",
  "GPT Image 1.5",
  "GPT Image 2",
  "Seedream 4.5",
  "Recraft v4",
  "Flux Kontext Pro",
  "Flux Kontext Max",
  "MiniMax Image-01",
  "Imagen 4 Ultra",
  "Imagen 4",
  "Imagen 4 Fast",
  "Clarity Upscaler",
  "Real-ESRGAN",
  "Crystal Upscaler",
  "Topaz Upscaler",
  "SeedVR Upscaler",
  "851 Labs Remove BG",
  "Lucataco Remove BG",
  "Bria GenFill",
  "Bria Expand",
  "Recraft Vectorize",
  "Image2SVG",
];

const LABEL_TO_STORED: Record<string, string | string[]> = {
  // Quick picks
  "Flux Dev": "flux-dev",
  /** Default free-tier turbo (generationSlice default). */
  Classic: "new-turbo-model",
  "Nano Banana": "gemini-25-flash-image",

  // Core image models (align with ModelsDropdown / handleGenerate)
  "Flux.2 Pro": "flux-2-pro",
  "Flux 2 Pro": "flux-2-pro",
  "Qwen Image 2 Pro": "qwen/qwen-image-2-pro",
  "Qwen Image 2": "qwen/qwen-image-2",
  "Nano Banana 2": "google/nano-banana-2",
  "Seedream 5 Lite": "seedream-5-lite",
  /** Firestore stores exactly `google/nano-banana-pro` (slash path). */
  "Nano Banana Pro": "google/nano-banana-pro",
  "z-image-turbo": "new-turbo-model",
  "GPT Image 1.5": "openai/gpt-image-1.5",
  "GPT Image 2": "openai/gpt-image-2",
  "Seedream 4.5": "seedream-4.5",
  "Recraft v4": "recraft-ai/recraft-v4",
  "Flux Kontext Pro": "flux-kontext-pro",
  "Flux Kontext Max": "flux-kontext-max",
  "MiniMax Image-01": "minimax-image-01",
  "Imagen 4 Ultra": "imagen-4-ultra",
  "Imagen 4": "imagen-4",
  "Imagen 4 Fast": "imagen-4-fast",

  // Upscale (Replicate / FAL bases — backend uses base match for :version rows)
  "Clarity Upscaler": "philz1337x/clarity-upscaler",
  "Real-ESRGAN": "nightmareai/real-esrgan",
  "Crystal Upscaler": "philz1337x/crystal-upscaler",
  "Topaz Upscaler": "fal-ai/topaz/upscale/image",
  "SeedVR Upscaler": [
    "fal-ai/seedvr/upscale/image",
    "fal-ai/seedvr/upscale/video",
  ],

  // Remove BG
  "851 Labs Remove BG": "851-labs/background-remover",
  "Lucataco Remove BG": "lucataco/remove-bg",

  // Edit / expand / vectorize
  "Bria GenFill": "fal-ai/bria/genfill",
  "Bria Expand": "replicate/bria/expand-image",
  "Recraft Vectorize": "fal-ai/recraft/vectorize",
  Image2SVG: "fal-ai/image2svg",
};

/** Rows for audits / scripts: filter label → value(s) sent to `/api/generations`. */
export function getHistoryFilterModelAuditRows(): Array<{
  filterLabel: string;
  firestoreModel: string | string[];
}> {
  return FILTER_POPUP_MODEL_LABELS.map((filterLabel) => ({
    filterLabel,
    firestoreModel:
      LABEL_TO_STORED[filterLabel] ??
      (() => {
        throw new Error(
          `[historyFilterModelChipMap] Missing LABEL_TO_STORED for "${filterLabel}"`,
        );
      })(),
  }));
}

export function mapHistoryFilterModelChipToStoredModel(
  label: string | null | undefined,
): string | string[] | null {
  if (label == null) return null;
  const t = String(label).trim();
  if (!t) return null;
  const mapped = LABEL_TO_STORED[t];
  if (mapped !== undefined) return mapped;
  const lower = t.toLowerCase();
  // Already a persisted-style id
  if (!/\s/.test(t) && /^[a-z0-9./:_-]+$/i.test(lower)) {
    return lower;
  }
  return null;
}

export function mapHistoryFilterModelChipsToStoredModels(
  labels: string[] | null | undefined,
): string[] {
  if (!labels?.length) return [];
  const out: string[] = [];
  for (const label of labels) {
    const m = mapHistoryFilterModelChipToStoredModel(label);
    if (m == null) continue;
    if (Array.isArray(m)) out.push(...m);
    else out.push(m);
  }
  return Array.from(new Set(out.map((s) => String(s).trim()).filter(Boolean)));
}
