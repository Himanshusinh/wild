import { sufembroideryPromptV3 } from "./sufembroideryPromptV3";
export type SufEmbroideryVersion = "V3";
export interface SufEmbroideryPromptFamily {
  version: SufEmbroideryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const SUFEMBROIDERY_PROMPT_FAMILIES: Record<SufEmbroideryVersion, SufEmbroideryPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic SUF EMBROIDERY World",
      ...sufembroideryPromptV3,
    },
};