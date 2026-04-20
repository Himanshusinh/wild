import { sonowaltextilePromptV3 } from "./sonowaltextilePromptV3";
export type SonowalTextileVersion = "V3";
export interface SonowalTextilePromptFamily {
  version: SonowalTextileVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const SONOWALTEXTILE_PROMPT_FAMILIES: Record<SonowalTextileVersion, SonowalTextilePromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic SONOWAL TEXTILE World",
      ...sonowaltextilePromptV3,
    },
};