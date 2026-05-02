import { chikankariPromptV1 } from "./chikankariPromptV1";
import { chikankariPromptV2 } from "./chikankariPromptV2";
import { chikankariPromptV3 } from "./chikankariPromptV3";

export type ChikankariVersion = "V1" | "V2" | "V3";

export const CHIKANKARI_PROMPT_FAMILIES: Record<ChikankariVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: chikankariPromptV1,
  V2: chikankariPromptV2,
  V3: chikankariPromptV3,
};
