import { narayanpetsareePromptV1 } from "./narayanpetsareePromptV1";
import { narayanpetsareePromptV2 } from "./narayanpetsareePromptV2";
import { narayanpetsareePromptV3 } from "./narayanpetsareePromptV3";

export type NarayanpetsareeVersion = "V1" | "V2" | "V3";

export const NARAYANPETSAREE_PROMPT_FAMILIES: Record<NarayanpetsareeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: narayanpetsareePromptV1,
  V2: narayanpetsareePromptV2,
  V3: narayanpetsareePromptV3,
};
