import { paithaniPromptV1 } from "./paithaniPromptV1";
import { paithaniPromptV2 } from "./paithaniPromptV2";
import { paithaniPromptV3 } from "./paithaniPromptV3";

export type PaithaniVersion = "V1" | "V2" | "V3";

export interface PaithaniPromptFamily {
  version: PaithaniVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PAITHANI_PROMPT_FAMILIES: Record<PaithaniVersion, PaithaniPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Paithani",
    ...paithaniPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SILK",
    title: "Paithani Variations",
    ...paithaniPromptV2,
  },
  V3: {
    version: "V3",
    chip: "LOOM-WOVEN",
    title: "Dimensional Paithani",
    ...paithaniPromptV3,
  },
};
