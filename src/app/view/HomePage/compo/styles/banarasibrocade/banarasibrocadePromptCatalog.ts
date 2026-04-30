import { banarasibrocadePromptV1 } from "./banarasibrocadePromptV1";
import { banarasibrocadePromptV2 } from "./banarasibrocadePromptV2";
import { banarasibrocadePromptV3 } from "./banarasibrocadePromptV3";

export type BanarasibrocadeVersion = "V1" | "V2" | "V3";

export const BANARASIBROCADE_PROMPT_FAMILIES: Record<BanarasibrocadeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: banarasibrocadePromptV1,
  V2: banarasibrocadePromptV2,
  V3: banarasibrocadePromptV3,
};
