import { bomkaiPromptV1 } from "./bomkaiPromptV1";
import { bomkaiPromptV2 } from "./bomkaiPromptV2";
import { bomkaiPromptV3 } from "./bomkaiPromptV3";

export type BomkaiVersion = "V1" | "V2" | "V3";

export interface BomkaiPromptFamily {
  version: BomkaiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BOMKAI_PROMPT_FAMILIES: Record<BomkaiVersion, BomkaiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Bomkai",
    ...bomkaiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Bomkai",
    ...bomkaiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Bomkai",
    ...bomkaiPromptV3,
  },
};
