import { pithoraPromptV1 } from "./pithoraPromptV1";
import { pithoraPromptV2 } from "./pithoraPromptV2";
import { pithoraPromptV3 } from "./pithoraPromptV3";

export type PithoraVersion = "V1" | "V2" | "V3";

export interface PithoraPromptFamily {
  version: PithoraVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PITHORA_PROMPT_FAMILIES: Record<PithoraVersion, PithoraPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Pithora Ritual Painting",
    ...pithoraPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Pithora World",
    ...pithoraPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Pithora World",
    ...pithoraPromptV3,
  },
};
