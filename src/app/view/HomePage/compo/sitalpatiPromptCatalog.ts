import { sitalpatiPromptV3 } from "./sitalpatiPromptV3";
export type SitalpatiVersion = "V3";
export interface SitalpatiPromptFamily {
  version: SitalpatiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const SITALPATI_PROMPT_FAMILIES: Record<SitalpatiVersion, SitalpatiPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic SITALPATI World",
      ...sitalpatiPromptV3,
    },
};