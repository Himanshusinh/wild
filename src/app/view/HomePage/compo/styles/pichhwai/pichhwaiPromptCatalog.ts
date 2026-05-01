import { pichhwaiPromptV1 } from "./pichhwaiPromptV1";
import { pichhwaiPromptV2 } from "./pichhwaiPromptV2";
import { pichhwaiPromptV3 } from "./pichhwaiPromptV3";

export type PichhwaiVersion = "V1" | "V2" | "V3";

export interface PichhwaiPromptFamily {
  version: PichhwaiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PICHHWAI_PROMPT_FAMILIES: Record<PichhwaiVersion, PichhwaiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Pichhwai",
    ...pichhwaiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Pichhwai",
    ...pichhwaiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Pichhwai",
    ...pichhwaiPromptV3,
  },
};
