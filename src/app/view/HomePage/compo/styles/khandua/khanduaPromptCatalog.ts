import { khanduaPromptV1 } from "./khanduaPromptV1";
import { khanduaPromptV2 } from "./khanduaPromptV2";
import { khanduaPromptV3 } from "./khanduaPromptV3";

export type KhanduaVersion = "V1" | "V2" | "V3";

export interface KhanduaPromptFamily {
  version: KhanduaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHANDUA_PROMPT_FAMILIES: Record<KhanduaVersion, KhanduaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Khandua",
    ...khanduaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Khandua",
    ...khanduaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Khandua",
    ...khanduaPromptV3,
  },
};
