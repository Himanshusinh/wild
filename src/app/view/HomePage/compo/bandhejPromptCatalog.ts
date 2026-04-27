import { bandhejPromptV1 } from "./bandhejPromptV1";
import { bandhejPromptV2 } from "./bandhejPromptV2";
import { bandhejPromptV3 } from "./bandhejPromptV3";

export type BandhejVersion = "V1" | "V2" | "V3";

export interface BandhejPromptFamily {
  version: BandhejVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BANDHEJ_PROMPT_FAMILIES: Record<BandhejVersion, BandhejPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Bandhej",
    ...bandhejPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Bandhej",
    ...bandhejPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Bandhej",
    ...bandhejPromptV3,
  },
};
