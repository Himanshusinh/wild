import { gotazariPromptV1 } from "./gotazariPromptV1";
import { gotazariPromptV2 } from "./gotazariPromptV2";
import { gotazariPromptV3 } from "./gotazariPromptV3";

export type GotazariVersion = "V1" | "V2" | "V3";

export const GOTAZARI_PROMPT_FAMILIES: Record<GotazariVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: gotazariPromptV1,
  V2: gotazariPromptV2,
  V3: gotazariPromptV3,
};
