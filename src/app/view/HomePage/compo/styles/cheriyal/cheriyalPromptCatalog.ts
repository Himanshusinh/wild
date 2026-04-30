import { cheriyalPromptV1 } from "./cheriyalPromptV1";
import { cheriyalPromptV2 } from "./cheriyalPromptV2";
import { cheriyalPromptV3 } from "./cheriyalPromptV3";

export type CheriyalVersion = "V1" | "V2" | "V3";

export const CHERIYAL_PROMPT_FAMILIES: Record<CheriyalVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: cheriyalPromptV1,
  V2: cheriyalPromptV2,
  V3: cheriyalPromptV3,
};
