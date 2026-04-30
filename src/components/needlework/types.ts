import type { NeedleworkVersion } from "@/app/view/HomePage/compo/styles/needlework/needleworkPromptCatalog";
import type { WarliAspectRatioChoice } from "@/components/warli/warliNanoAspect";

export type StyleFamily = NeedleworkVersion;
export type InputMode = "text" | "image";
export type ModelId = "google/nano-banana-2" | "google/nano-banana-pro";
export type ImageCount = 1 | 2 | 4;
export type AspectRatio = WarliAspectRatioChoice;
export type RightPanelState = "empty" | "loading" | "results";

export interface NeedleworkState {
  style: StyleFamily;
  inputMode: InputMode;
  sceneText: string;
  uploadedImage: string | null;
  imageNote: string;
  model: ModelId;
  resolution: string;
  imageCount: ImageCount;
  ratio: AspectRatio;
  includeVariable: boolean;
  panelState: RightPanelState;
  generatedImages: string[];
  assembledPrompt: string;
}

export const MODELS = [
  { id: "google/nano-banana-2" as const, label: "Nano Banana 2", tag: "Google" },
  { id: "google/nano-banana-pro" as const, label: "Nano Banana Pro", tag: "Google" },
];

export const IMAGE_COUNTS: ImageCount[] = [1, 2, 4];

export const STYLE_LABELS: Record<StyleFamily, { badge: string; title: string }> = {
  V1: { badge: "AUTHENTIC", title: "Authentic Needlework" },
  V2: { badge: "ARTISAN", title: "Dimensional Needlework" },
  V3: { badge: "CINEMATIC", title: "3D Cinematic Needlework" },
};

export const INITIAL_STATE: NeedleworkState = {
  style: "V1",
  inputMode: "text",
  sceneText: "",
  uploadedImage: null,
  imageNote: "",
  model: "google/nano-banana-2",
  resolution: "1K",
  imageCount: 2,
  ratio: "auto",
  includeVariable: false,
  panelState: "empty",
  generatedImages: [],
  assembledPrompt: "",
};
