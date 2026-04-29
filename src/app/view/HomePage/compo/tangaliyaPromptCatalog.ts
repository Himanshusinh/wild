import { tangaliyaPromptV1 } from "./tangaliyaPromptV1";
import { tangaliyaPromptV2 } from "./tangaliyaPromptV2";
import { tangaliyaPromptV3 } from "./tangaliyaPromptV3";

export type TangaliyaVersion = "V1" | "V2" | "V3";

export interface TangaliyaPromptFamily {
  version: TangaliyaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TANGALIYA_PROMPT_FAMILIES: Record<TangaliyaVersion, TangaliyaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Tangaliya",
    ...tangaliyaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "WOVEN",
    title: "Tangaliya Variations",
    ...tangaliyaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "BEADED",
    title: "Dimensional Tangaliya",
    ...tangaliyaPromptV3,
  },
};
