import type { WarliAspectRatioChoice } from "./warliNanoAspect";

export type StyleFamily = "A" | "B" | "C";
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
  A: { badge: "2D MURAL", title: "Traditional 2D Mural" },
  B: { badge: "BAS-RELIEF", title: "Terracotta Bas-Relief" },
  C: { badge: "3D WORLD", title: "Full Cinematic 3D" },
};

export const INITIAL_STATE: WarliState = {
  style: "A",
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
