import { banarasmuralPromptV1 } from "./banarasmuralPromptV1";
import { banarasmuralPromptV2 } from "./banarasmuralPromptV2";
import { banarasmuralPromptV3 } from "./banarasmuralPromptV3";

export type BanarasmuralVersion = "V1" | "V2" | "V3";

export const BANARASMURAL_PROMPT_FAMILIES: Record<BanarasmuralVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: banarasmuralPromptV1,
  V2: banarasmuralPromptV2,
  V3: banarasmuralPromptV3,
};
