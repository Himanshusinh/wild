import { zardoziPromptV1 } from "./zardoziPromptV1";
import { zardoziPromptV2 } from "./zardoziPromptV2";
import { zardoziPromptV3 } from "./zardoziPromptV3";

export type ZardoziVersion = "V1" | "V2" | "V3";

export const ZARDOZI_PROMPT_FAMILIES: Record<ZardoziVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: zardoziPromptV1,
  V2: zardoziPromptV2,
  V3: zardoziPromptV3,
};
