import { gollabhamasareePromptV1 } from "./gollabhamasareePromptV1";
import { gollabhamasareePromptV2 } from "./gollabhamasareePromptV2";
import { gollabhamasareePromptV3 } from "./gollabhamasareePromptV3";

export type GollabhamasareeVersion = "V1" | "V2" | "V3";

export const GOLLABHAMASAREE_PROMPT_FAMILIES: Record<GollabhamasareeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: gollabhamasareePromptV1,
  V2: gollabhamasareePromptV2,
  V3: gollabhamasareePromptV3,
};
