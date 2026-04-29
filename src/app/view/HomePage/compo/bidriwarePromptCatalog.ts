import { bidriwarePromptV1 } from "./bidriwarePromptV1";
import { bidriwarePromptV2 } from "./bidriwarePromptV2";
import { bidriwarePromptV3 } from "./bidriwarePromptV3";

export type BidriwareVersion = "V1" | "V2" | "V3";

export interface BidriwarePromptFamily {
  version: BidriwareVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BIDRIWARE_PROMPT_FAMILIES: Record<BidriwareVersion, BidriwarePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Bidriware",
    ...bidriwarePromptV1,
  },
  V2: {
    version: "V2",
    chip: "INLAY",
    title: "Bidriware Variations",
    ...bidriwarePromptV2,
  },
  V3: {
    version: "V3",
    chip: "ALLOY",
    title: "Dimensional Bidriware",
    ...bidriwarePromptV3,
  },
};
