import { durriePromptV1 } from "./durriePromptV1";
import { durriePromptV2 } from "./durriePromptV2";
import { durriePromptV3 } from "./durriePromptV3";

export type DurrieVersion = "V1" | "V2" | "V3";

export interface DurriePromptFamily {
  version: DurrieVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const DURRIE_PROMPT_FAMILIES: Record<DurrieVersion, DurriePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Durrie",
    ...durriePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Durrie",
    ...durriePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Durrie",
    ...durriePromptV3,
  },
};
