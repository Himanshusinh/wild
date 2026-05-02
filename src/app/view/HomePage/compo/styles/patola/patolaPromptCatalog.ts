import { patolaPromptV1 } from "./patolaPromptV1";
import { patolaPromptV2 } from "./patolaPromptV2";
import { patolaPromptV3 } from "./patolaPromptV3";

export type PatolaVersion = "V1" | "V2" | "V3";

export interface PatolaPromptFamily {
  version: PatolaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PATOLA_PROMPT_FAMILIES: Record<PatolaVersion, PatolaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Patola Pattern Surface",
    ...patolaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Patola World",
    ...patolaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Patola World",
    ...patolaPromptV3,
  },
};
