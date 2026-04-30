import { rignaiPromptV1 } from "./rignaiPromptV1";
import { rignaiPromptV2 } from "./rignaiPromptV2";
import { rignaiPromptV3 } from "./rignaiPromptV3";

export type RignaiVersion = "V1" | "V2" | "V3";

export const RIGNAI_PROMPT_FAMILIES: Record<RignaiVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: rignaiPromptV1,
  V2: rignaiPromptV2,
  V3: rignaiPromptV3,
};
