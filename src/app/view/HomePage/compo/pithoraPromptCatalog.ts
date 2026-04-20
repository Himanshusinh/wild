import { pithoraPromptV3 } from "./pithoraPromptV3";
export type PithoraVersion = "V3";
export interface PithoraPromptFamily {
  version: PithoraVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const PITHORA_PROMPT_FAMILIES: Record<PithoraVersion, PithoraPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic PITHORA World",
      ...pithoraPromptV3,
    },
};