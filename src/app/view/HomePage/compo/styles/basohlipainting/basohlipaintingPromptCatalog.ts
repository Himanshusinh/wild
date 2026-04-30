import { basohlipaintingPromptV1 } from "./basohlipaintingPromptV1";
import { basohlipaintingPromptV2 } from "./basohlipaintingPromptV2";
import { basohlipaintingPromptV3 } from "./basohlipaintingPromptV3";

export type BasohlipaintingVersion = "V1" | "V2" | "V3";

export interface BasohlipaintingPromptFamily {
  version: BasohlipaintingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BASOHLIPAINTING_PROMPT_FAMILIES: Record<BasohlipaintingVersion, BasohlipaintingPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "BASOHLI PAINTING", ...basohlipaintingPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "BASOHLI PAINTING", ...basohlipaintingPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "BASOHLI PAINTING", ...basohlipaintingPromptV3 },
};
