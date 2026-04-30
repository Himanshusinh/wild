import { gadwalsareePromptV1 } from "./gadwalsareePromptV1";
import { gadwalsareePromptV2 } from "./gadwalsareePromptV2";
import { gadwalsareePromptV3 } from "./gadwalsareePromptV3";

export type GadwalsareeVersion = "V1" | "V2" | "V3";

export const GADWALSAREE_PROMPT_FAMILIES: Record<GadwalsareeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: gadwalsareePromptV1,
  V2: gadwalsareePromptV2,
  V3: gadwalsareePromptV3,
};
