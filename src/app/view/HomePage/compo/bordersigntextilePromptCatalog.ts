import { bordersigntextilePromptV1 } from "./bordersigntextilePromptV1";
import { bordersigntextilePromptV2 } from "./bordersigntextilePromptV2";
import { bordersigntextilePromptV3 } from "./bordersigntextilePromptV3";

export type BorderSignTextileVersion = "V1" | "V2" | "V3";

export interface BorderSignTextilePromptFamily {
  version: BorderSignTextileVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BORDERSIGNTEXTILE_PROMPT_FAMILIES: Record<BorderSignTextileVersion, BorderSignTextilePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BorderSignTextile",
    ...bordersigntextilePromptV1,
  },
  V2: {
    version: "V2",
    chip: "BORDER",
    title: "BorderSignTextile Variations",
    ...bordersigntextilePromptV2,
  },
  V3: {
    version: "V3",
    chip: "FIELD",
    title: "Dimensional BorderSignTextile",
    ...bordersigntextilePromptV3,
  },
};
