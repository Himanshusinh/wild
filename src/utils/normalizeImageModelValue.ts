const IMAGE_MODEL_ALIASES: Record<string, string> = {
  "z-image-turbo": "new-turbo-model",
  "prunaai/z-image-turbo": "new-turbo-model",
  "bytedance/seedream-4": "seedream-v4",
  "bytedance/seedream-4.5": "seedream-4.5",
  "bytedance/seedream-5-lite": "seedream-5-lite",
  "recraft-v4": "recraft-ai/recraft-v4",
  "replicate/recraft-ai/recraft-v4": "recraft-ai/recraft-v4",
  "nano-banana-pro": "google/nano-banana-pro",
  "qwen/qwen-image-edit-2511": "qwen-image-edit-2511",
  "qwen/qwen-image-edit-2512": "qwen-image-edit-2512",
  "qwen/qwen-image-2511": "qwen-image-2511",
  "qwen/qwen-image-2512": "qwen-image-2512",
  "851-labs/background-remover": "google/nano-banana-2",
  "lucataco/remove-bg": "google/nano-banana-2",
};

export function normalizeImageModelValue(
  modelValue: string | undefined | null,
): string {
  const normalized = String(modelValue || "").trim();
  if (!normalized) return "";
  return IMAGE_MODEL_ALIASES[normalized] || normalized;
}
