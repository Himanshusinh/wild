import { bandhaniPromptV1 } from "./bandhaniPromptV1";
import { bandhaniPromptV2 } from "./bandhaniPromptV2";
import { bandhaniPromptV3 } from "./bandhaniPromptV3";

export type BandhaniVersion = "V1" | "V2" | "V3";

export interface BandhaniPromptFamily {
  version: BandhaniVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BANDHANI_PROMPT_FAMILIES: Record<BandhaniVersion, BandhaniPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Bandhani",
    ...bandhaniPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Bandhani Variations",
    ...bandhaniPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CEREMONIAL",
    title: "Dimensional Bandhani",
    ...bandhaniPromptV3,
  },
};
