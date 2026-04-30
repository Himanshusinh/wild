import { tholuPromptV1 } from "./tholuPromptV1";
import { tholuPromptV2 } from "./tholuPromptV2";
import { tholuPromptV3 } from "./tholuPromptV3";

export type TholuVersion = "V1" | "V2" | "V3";

export interface TholuPromptFamily {
  version: TholuVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const THOLU_PROMPT_FAMILIES: Record<TholuVersion, TholuPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Tholu Bommalata",
    ...tholuPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Hybrid 2D/3D",
    ...tholuPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Volumetric World",
    ...tholuPromptV3,
  },
};

