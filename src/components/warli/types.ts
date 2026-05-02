import type { WarliAspectRatioChoice } from "./warliNanoAspect";

export type StyleFamily = "V1" | "V2" | "V3";
export type InputMode = "text" | "image";
export type ModelId = "google/nano-banana-2" | "google/nano-banana-pro";
export type ImageCount = 1 | 2 | 4;
export type AspectRatio = WarliAspectRatioChoice;
export type RightPanelState = "empty" | "loading" | "results";

export interface WarliState {
  style: StyleFamily;
  inputMode: InputMode;
  sceneText: string;
  uploadedImage: string | null;
  imageNote: string;
  model: ModelId;
  /** FAL output resolution; options depend on model (see SettingsPanel). */
  resolution: string;
  imageCount: ImageCount;
  ratio: AspectRatio;
  includeBenchmark: boolean;
  includeVariable: boolean;
  includeRestyle: boolean;
  panelState: RightPanelState;
  generatedImages: string[];
  assembledPrompt: string;
}

export interface ModelOption {
  id: ModelId;
  label: string;
  tag: string;
}

export const MODELS: ModelOption[] = [
  { id: "google/nano-banana-2", label: "Nano Banana 2", tag: "Google" },
  { id: "google/nano-banana-pro", label: "Nano Banana Pro", tag: "Google" },
];

export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];

export const STYLE_LABELS: Record<StyleFamily, { badge: string; title: string }> = {
  V1: { badge: "AUTHENTIC", title: "Authentic Warli" },
  V2: { badge: "ARTISAN", title: "Artisan Warli" },
  V3: { badge: "CINEMATIC", title: "Cinematic Warli" },
};

export const INITIAL_STATE: WarliState = {
  style: "V1",
  inputMode: "text",
  sceneText: "",
  uploadedImage: null,
  imageNote: "",
  model: "google/nano-banana-2",
  resolution: "1K",
  imageCount: 2,
  ratio: "auto",
  includeBenchmark: false,
  includeVariable: false,
  includeRestyle: false,
  panelState: "empty",
  generatedImages: [],
  assembledPrompt: "",
};
