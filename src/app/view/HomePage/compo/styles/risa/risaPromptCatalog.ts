import { risaPromptV1 } from "./risaPromptV1";
import { risaPromptV2 } from "./risaPromptV2";
import { risaPromptV3 } from "./risaPromptV3";

export type RisaVersion = "V1" | "V2" | "V3";

export const RISA_PROMPT_FAMILIES: Record<RisaVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: risaPromptV1,
  V2: risaPromptV2,
  V3: risaPromptV3,
};
