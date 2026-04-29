/**
 * FAL `aspect_ratio` enum per model — send these strings verbatim on the request body.
 * Defaults: Nano Banana Pro → 1:1, Nano Banana 2 → auto (per schema).
 */

export type NanoBananaModelId = "google/nano-banana-2" | "google/nano-banana-pro";

/** Nano Banana Pro — no extreme 4:1 / 1:8 family. Default in API: 1:1 */
export const NANO_BANANA_PRO_ASPECT_RATIO_ENUM = [
  "auto",
  "21:9",
  "16:9",
  "3:2",
  "4:3",
  "5:4",
  "1:1",
  "4:5",
  "3:4",
  "2:3",
  "9:16",
] as const;

/** Nano Banana 2 — includes extreme ratios. Default in API: auto */
export const NANO_BANANA_2_ASPECT_RATIO_ENUM = [
  "auto",
  "21:9",
  "16:9",
  "3:2",
  "4:3",
  "5:4",
  "1:1",
  "4:5",
  "3:4",
  "2:3",
  "9:16",
  "4:1",
  "1:4",
  "8:1",
  "1:8",
] as const;

export type NanoBananaProAspectRatio = (typeof NANO_BANANA_PRO_ASPECT_RATIO_ENUM)[number];
export type NanoBanana2AspectRatio = (typeof NANO_BANANA_2_ASPECT_RATIO_ENUM)[number];

export type WarliAspectRatioChoice = NanoBananaProAspectRatio | NanoBanana2AspectRatio;

const PRO_SET = new Set<string>(NANO_BANANA_PRO_ASPECT_RATIO_ENUM);
const NB2_SET = new Set<string>(NANO_BANANA_2_ASPECT_RATIO_ENUM);

export function getAspectRatioMenuForModel(model: NanoBananaModelId): readonly string[] {
  return model === "google/nano-banana-pro"
    ? NANO_BANANA_PRO_ASPECT_RATIO_ENUM
    : NANO_BANANA_2_ASPECT_RATIO_ENUM;
}

/** Map invalid / legacy values to a valid enum member for the selected model. */
export function coerceWarliAspectRatio(raw: string, model: NanoBananaModelId): WarliAspectRatioChoice {
  const v = String(raw || "").trim();
  const set = model === "google/nano-banana-pro" ? PRO_SET : NB2_SET;
  if (set.has(v)) return v as WarliAspectRatioChoice;
  return model === "google/nano-banana-pro" ? "1:1" : "auto";
}

/** FAL `resolution` values allowed per model (see validateFalGenerate). */
export const NANO_BANANA_2_RESOLUTION_OPTIONS = ["0.5K", "1K", "2K", "4K"] as const;
export const NANO_BANANA_PRO_RESOLUTION_OPTIONS = ["1K", "2K", "4K"] as const;

const PRO_RES_SET = new Set<string>(NANO_BANANA_PRO_RESOLUTION_OPTIONS);
const NB2_RES_SET = new Set<string>(NANO_BANANA_2_RESOLUTION_OPTIONS);

export function getResolutionMenuForModel(model: NanoBananaModelId): readonly string[] {
  return model === "google/nano-banana-pro"
    ? NANO_BANANA_PRO_RESOLUTION_OPTIONS
    : NANO_BANANA_2_RESOLUTION_OPTIONS;
}

/** Default when opening a modal or after model switch drops an invalid tier (e.g. 0.5K → Pro). */
export function defaultResolutionForStyleModal(model: NanoBananaModelId): string {
  return model === "google/nano-banana-pro" ? "2K" : "1K";
}

export function coerceStyleModalResolution(
  raw: string | undefined,
  model: NanoBananaModelId,
): string {
  const v = String(raw ?? "").trim();
  const set = model === "google/nano-banana-pro" ? PRO_RES_SET : NB2_RES_SET;
  if (set.has(v)) return v;
  return defaultResolutionForStyleModal(model);
}
