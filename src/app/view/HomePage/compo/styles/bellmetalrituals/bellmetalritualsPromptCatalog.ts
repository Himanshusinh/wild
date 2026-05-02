import { bellmetalritualsPromptV1 } from "./bellmetalritualsPromptV1";
import { bellmetalritualsPromptV2 } from "./bellmetalritualsPromptV2";
import { bellmetalritualsPromptV3 } from "./bellmetalritualsPromptV3";

export type BellMetalRitualsVersion = "V1" | "V2" | "V3";

export interface BellMetalRitualsPromptFamily {
  version: BellMetalRitualsVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BELLMETALRITUALS_PROMPT_FAMILIES: Record<BellMetalRitualsVersion, BellMetalRitualsPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BellMetalRituals",
    ...bellmetalritualsPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SACRED",
    title: "BellMetalRituals Variations",
    ...bellmetalritualsPromptV2,
  },
  V3: {
    version: "V3",
    chip: "BELL-METAL",
    title: "Dimensional BellMetalRituals",
    ...bellmetalritualsPromptV3,
  },
};
