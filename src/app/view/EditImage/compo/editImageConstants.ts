/** General catalog styles shown in Edit → Style Combination (aligned with image gen Style popup). */
export const STYLE_COMBO_GENERAL_IDS = new Set([
  "neutral_studio",
  "realistic",
  "minimalist",
  "watercolor",
  "oil_painting",
  "abstract",
  "cyberpunk",
  "neon_noir",
  "isometric",
  "vintage_poster",
  "vaporwave",
  "pixel_art",
  "cartoon",
  "pencil_sketch",
  "claymation",
  "fantasy",
  "sci_fi",
  "steampunk",
  "abstract_geometry",
  "surrealism",
  "3d_cartoon",
  "ukiyoe",
  "graffiti",
  "renaissance",
  "pop_art",
]);

export const STYLE_COMBO_MAX_SELECTIONS = 12;

/** Base image models for Edit → Style Combination (image-to-image). */
export const STYLE_COMBO_BASE_MODELS: Array<{
  label: string;
  value: "google/nano-banana-pro" | "google/nano-banana-2";
}> = [
  { label: "Nano Banana Pro", value: "google/nano-banana-pro" },
  { label: "Nano Banana 2", value: "google/nano-banana-2" },
];

export const aspectPresets: Record<
  string,
  {
    label: string;
    sizeLabel?: string;
    width: number;
    height: number;
    aspectRatio: number;
  }
> = {
  custom: {
    label: "Custom",
    sizeLabel: "Custom",
    width: 1024,
    height: 1024,
    aspectRatio: 1,
  },
  "1:1": {
    label: "1:1",
    sizeLabel: "1500 × 1500",
    width: 1500,
    height: 1500,
    aspectRatio: 1,
  },
  "2:3": {
    label: "2:3",
    sizeLabel: "1334 × 2000",
    width: 1334,
    height: 2000,
    aspectRatio: 2 / 3,
  },
  "3:2": {
    label: "3:2",
    sizeLabel: "1800 × 1200",
    width: 1800,
    height: 1200,
    aspectRatio: 3 / 2,
  },
  "3:4": {
    label: "3:4",
    sizeLabel: "1350 × 1800",
    width: 1350,
    height: 1800,
    aspectRatio: 3 / 4,
  },
  "4:3": {
    label: "4:3",
    sizeLabel: "1600 × 1200",
    width: 1600,
    height: 1200,
    aspectRatio: 4 / 3,
  },
  "4:5": {
    label: "4:5",
    sizeLabel: "1200 × 1500",
    width: 1200,
    height: 1500,
    aspectRatio: 4 / 5,
  },
  "5:4": {
    label: "5:4",
    sizeLabel: "1500 × 1200",
    width: 1500,
    height: 1200,
    aspectRatio: 5 / 4,
  },
  "9:16": {
    label: "9:16",
    sizeLabel: "1080 × 1920",
    width: 1080,
    height: 1920,
    aspectRatio: 9 / 16,
  },
  "16:9": {
    label: "16:9",
    sizeLabel: "1920 × 1080",
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
  },
};
