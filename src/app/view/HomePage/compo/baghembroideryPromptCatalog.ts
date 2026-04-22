import { baghembroideryPromptV1 } from "./baghembroideryPromptV1";
import { baghembroideryPromptV2 } from "./baghembroideryPromptV2";
import { baghembroideryPromptV3 } from "./baghembroideryPromptV3";

export type BaghEmbroideryVersion = "V1" | "V2" | "V3";

export interface BaghEmbroideryPromptFamily {
  version: BaghEmbroideryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BAGHEMBROIDERY_PROMPT_FAMILIES: Record<BaghEmbroideryVersion, BaghEmbroideryPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Bagh",
    ...baghembroideryPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Bagh",
    ...baghembroideryPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Bagh",
    ...baghembroideryPromptV3,
  },
};
