import { khaddarPromptV1 } from "./khaddarPromptV1";
import { khaddarPromptV2 } from "./khaddarPromptV2";
import { khaddarPromptV3 } from "./khaddarPromptV3";

export type KhaddarVersion = "V1" | "V2" | "V3";

export interface KhaddarPromptFamily {
  version: KhaddarVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHADDAR_PROMPT_FAMILIES: Record<KhaddarVersion, KhaddarPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Khaddar",
    ...khaddarPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Khaddar",
    ...khaddarPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Khaddar",
    ...khaddarPromptV3,
  },
};
