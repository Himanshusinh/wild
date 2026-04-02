export type StyleFamily = "A" | "B" | "C";
export type Variation = "template" | "variable" | "restyle";
export type InputMode = "text" | "image";
export type ModelId = "flux-2-pro" | "seedream-4.5" | "imagen-4";
export type ImageCount = 1 | 2 | 4;
export type AspectRatio = "1:1" | "4:5" | "16:9";
export type RightPanelState = "empty" | "loading" | "results";

export interface WarliState {
  style: StyleFamily;
  inputMode: InputMode;
  sceneText: string;
  uploadedImage: string | null;
  imageNote: string;
  variation: Variation;
  model: ModelId;
  imageCount: ImageCount;
  ratio: AspectRatio;
  panelState: RightPanelState;
  generatedImages: string[];
  assembledPrompt: string;
}

export interface ModelOption {
  id: ModelId;
  label: string;
  tag: string;
}

export interface VariationOption {
  id: Variation;
  label: string;
  desc: string;
}

export const MODELS: ModelOption[] = [
  { id: "flux-2-pro", label: "Flux 2 Pro", tag: "Detailed" },
  { id: "seedream-4.5", label: "Seedream 4.5", tag: "Balanced" },
  { id: "imagen-4", label: "Imagen 4", tag: "Clean" },
];

export const VARIATIONS: VariationOption[] = [
  { id: "template", label: "Template", desc: "Full lock" },
  { id: "variable", label: "Variable", desc: "Slots" },
  { id: "restyle", label: "Restyle", desc: "Preserve" },
];

export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];
export const RATIOS: AspectRatio[] = ["1:1", "4:5", "16:9"];

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
  variation: "template",
  model: "flux-2-pro",
  imageCount: 2,
  ratio: "1:1",
  panelState: "empty",
  generatedImages: [],
  assembledPrompt: "",
};
