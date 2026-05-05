import { normalizeImageModelValue } from "@/utils/normalizeImageModelValue";

export const getInputImageLimitForModel = (model?: string): number => {
  const normalizedModel = String(model || "")
    .trim()
    .toLowerCase();
  if (
    normalizedModel === "google/nano-banana-2" ||
    normalizedModel === "google/nano-banana-pro" ||
    normalizedModel === "nano-banana-pro" ||
    normalizedModel === "seedream-4.5" ||
    normalizedModel === "bytedance/seedream-4.5" ||
    normalizedModel === "seedream-5-lite" ||
    normalizedModel === "bytedance/seedream-5-lite"
  ) {
    return 14;
  }
  return 10;
};

export const normalizeIncomingImageModel = (model?: string | null): string =>
  normalizeImageModelValue(model);
