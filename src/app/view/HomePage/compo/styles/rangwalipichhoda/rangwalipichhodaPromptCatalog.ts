import { rangwalipichhodaPromptV1 } from "./rangwalipichhodaPromptV1";
import { rangwalipichhodaPromptV2 } from "./rangwalipichhodaPromptV2";
import { rangwalipichhodaPromptV3 } from "./rangwalipichhodaPromptV3";

export type RangwalipichhodaVersion = "V1" | "V2" | "V3";

export const RANGWALIPICHHODA_PROMPT_FAMILIES: Record<RangwalipichhodaVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: rangwalipichhodaPromptV1,
  V2: rangwalipichhodaPromptV2,
  V3: rangwalipichhodaPromptV3,
};
