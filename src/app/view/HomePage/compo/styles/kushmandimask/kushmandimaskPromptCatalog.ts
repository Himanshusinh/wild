import { kushmandimaskPromptV1 } from "./kushmandimaskPromptV1";
import { kushmandimaskPromptV2 } from "./kushmandimaskPromptV2";
import { kushmandimaskPromptV3 } from "./kushmandimaskPromptV3";

export type KushmandimaskVersion = "V1" | "V2" | "V3";

export interface KushmandimaskPromptFamily {
  version: KushmandimaskVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KUSHMANDIMASK_PROMPT_FAMILIES: Record<KushmandimaskVersion, KushmandimaskPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kushmandi Ritual Mask",
    ...kushmandimaskPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Carving Translation",
    ...kushmandimaskPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Mask World",
    ...kushmandimaskPromptV3,
  },
};
