import { sufembroideryPromptV1 } from "./sufembroideryPromptV1";
import { sufembroideryPromptV2 } from "./sufembroideryPromptV2";
import { sufembroideryPromptV3 } from "./sufembroideryPromptV3";

export type SufEmbroideryVersion = "V1" | "V2" | "V3";

export interface SufEmbroideryPromptFamily {
  version: SufEmbroideryVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SUFEMBROIDERY_PROMPT_FAMILIES: Record<SufEmbroideryVersion, SufEmbroideryPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Suf Embroidered Surface",
    ...sufembroideryPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Suf World",
    ...sufembroideryPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Suf World",
    ...sufembroideryPromptV3,
  },
};
