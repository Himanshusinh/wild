import { sanjhiPromptV1 } from "./sanjhiPromptV1";
import { sanjhiPromptV2 } from "./sanjhiPromptV2";
import { sanjhiPromptV3 } from "./sanjhiPromptV3";

export type SanjhiVersion = "V1" | "V2" | "V3";

export const SANJHI_PROMPT_FAMILIES: Record<SanjhiVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: sanjhiPromptV1,
  V2: sanjhiPromptV2,
  V3: sanjhiPromptV3,
};
