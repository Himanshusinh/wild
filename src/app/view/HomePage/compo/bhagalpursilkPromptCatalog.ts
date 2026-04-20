import { bhagalpursilkPromptV1 } from "./bhagalpursilkPromptV1";
import { bhagalpursilkPromptV2 } from "./bhagalpursilkPromptV2";
import { bhagalpursilkPromptV3 } from "./bhagalpursilkPromptV3";

export type BhagalpurSilkVersion = "V1" | "V2" | "V3";

export interface BhagalpurSilkPromptFamily {
  version: BhagalpurSilkVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BHAGALPURSILK_PROMPT_FAMILIES: Record<BhagalpurSilkVersion, BhagalpurSilkPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BhagalpurSilk",
    ...bhagalpursilkPromptV1,
  },
  V2: {
    version: "V2",
    chip: "HANDLOOM",
    title: "BhagalpurSilk Variations",
    ...bhagalpursilkPromptV2,
  },
  V3: {
    version: "V3",
    chip: "TUSSAR",
    title: "Dimensional BhagalpurSilk",
    ...bhagalpursilkPromptV3,
  },
};
