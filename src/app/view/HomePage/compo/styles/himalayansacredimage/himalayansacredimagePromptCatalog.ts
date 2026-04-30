import { himalayansacredimagePromptV1 } from "./himalayansacredimagePromptV1";
import { himalayansacredimagePromptV2 } from "./himalayansacredimagePromptV2";
import { himalayansacredimagePromptV3 } from "./himalayansacredimagePromptV3";

export type HimalayansacredimageVersion = "V1" | "V2" | "V3";

export interface HimalayansacredimagePromptFamily {
  version: HimalayansacredimageVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const HIMALAYANSACREDIMAGE_PROMPT_FAMILIES: Record<HimalayansacredimageVersion, HimalayansacredimagePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Ladakh Sacred Thangka",
    ...himalayansacredimagePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Ethereal Sacred Art",
    ...himalayansacredimagePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Thangka World",
    ...himalayansacredimagePromptV3,
  },
};
