import { puanlaisenPromptV1 } from "./puanlaisenPromptV1";
import { puanlaisenPromptV2 } from "./puanlaisenPromptV2";
import { puanlaisenPromptV3 } from "./puanlaisenPromptV3";

export type PuanlaisenVersion = "V1" | "V2" | "V3";

export interface PuanlaisenPromptFamily {
  version: PuanlaisenVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PUANLAISEN_PROMPT_FAMILIES: Record<PuanlaisenVersion, PuanlaisenPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Puanlaisen",
    ...puanlaisenPromptV1,
  },
  V2: {
    version: "V2",
    chip: "RED-BAND",
    title: "Puanlaisen Variations",
    ...puanlaisenPromptV2,
  },
  V3: {
    version: "V3",
    chip: "WOVEN",
    title: "Dimensional Puanlaisen",
    ...puanlaisenPromptV3,
  },
};
