import { shapheelanpheePromptV1 } from "./shapheelanpheePromptV1";
import { shapheelanpheePromptV2 } from "./shapheelanpheePromptV2";
import { shapheelanpheePromptV3 } from "./shapheelanpheePromptV3";

export type ShapheeLanpheeVersion = "V1" | "V2" | "V3";

export interface ShapheeLanpheePromptFamily {
  version: ShapheeLanpheeVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SHAPHEELANPHEE_PROMPT_FAMILIES: Record<ShapheeLanpheeVersion, ShapheeLanpheePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "ShapheeLanphee",
    ...shapheelanpheePromptV1,
  },
  V2: {
    version: "V2",
    chip: "HONOUR-CLOTH",
    title: "ShapheeLanphee Variations",
    ...shapheelanpheePromptV2,
  },
  V3: {
    version: "V3",
    chip: "SYMBOLIC",
    title: "Dimensional ShapheeLanphee",
    ...shapheelanpheePromptV3,
  },
};
