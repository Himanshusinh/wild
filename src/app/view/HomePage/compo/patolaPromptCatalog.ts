import { patolaPromptV3 } from "./patolaPromptV3";
export type PatolaVersion = "V3";
export interface PatolaPromptFamily {
  version: PatolaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const PATOLA_PROMPT_FAMILIES: Record<PatolaVersion, PatolaPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic PATOLA World",
      ...patolaPromptV3,
    },
};