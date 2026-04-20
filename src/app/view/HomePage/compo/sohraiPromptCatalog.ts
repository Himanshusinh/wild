import { sohraiPromptV1 } from "./sohraiPromptV1";
import { sohraiPromptV2 } from "./sohraiPromptV2";
import { sohraiPromptV3 } from "./sohraiPromptV3";

export type SohraiVersion = "V1" | "V2" | "V3";

export interface SohraiPromptFamily {
  version: SohraiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SOHRAI_PROMPT_FAMILIES: Record<SohraiVersion, SohraiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Sohrai Wall Painting Surface",
    ...sohraiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sohrai World",
    ...sohraiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Sohrai World",
    ...sohraiPromptV3,
  },
};
