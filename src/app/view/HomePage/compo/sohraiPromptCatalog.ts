import { sohraiPromptV3 } from "./sohraiPromptV3";
export type SohraiVersion = "V3";
export interface SohraiPromptFamily {
  version: SohraiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const SOHRAI_PROMPT_FAMILIES: Record<SohraiVersion, SohraiPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic SOHRAI World",
      ...sohraiPromptV3,
    },
};