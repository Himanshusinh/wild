import { thanjavurdollPromptV1 } from "./thanjavurdollPromptV1";
import { thanjavurdollPromptV2 } from "./thanjavurdollPromptV2";
import { thanjavurdollPromptV3 } from "./thanjavurdollPromptV3";

export type ThanjavurdollVersion = "V1" | "V2" | "V3";

export const THANJAVURDOLL_PROMPT_FAMILIES: Record<ThanjavurdollVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: thanjavurdollPromptV1,
  V2: thanjavurdollPromptV2,
  V3: thanjavurdollPromptV3,
};
