import { wangkheipheePromptV1 } from "./wangkheipheePromptV1";
import { wangkheipheePromptV2 } from "./wangkheipheePromptV2";
import { wangkheipheePromptV3 } from "./wangkheipheePromptV3";

export type WangkheiPheeVersion = "V1" | "V2" | "V3";

export interface WangkheiPheePromptFamily {
  version: WangkheiPheeVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const WANGKHEIPHEE_PROMPT_FAMILIES: Record<WangkheiPheeVersion, WangkheiPheePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "WangkheiPhee",
    ...wangkheipheePromptV1,
  },
  V2: {
    version: "V2",
    chip: "DELICATE",
    title: "WangkheiPhee Variations",
    ...wangkheipheePromptV2,
  },
  V3: {
    version: "V3",
    chip: "MUSLIN",
    title: "Dimensional WangkheiPhee",
    ...wangkheipheePromptV3,
  },
};
