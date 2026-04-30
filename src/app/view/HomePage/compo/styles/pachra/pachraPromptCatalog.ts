import { pachraPromptV1 } from "./pachraPromptV1";
import { pachraPromptV2 } from "./pachraPromptV2";
import { pachraPromptV3 } from "./pachraPromptV3";

export type PachraVersion = "V1" | "V2" | "V3";

export const PACHRA_PROMPT_FAMILIES: Record<PachraVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: pachraPromptV1,
  V2: pachraPromptV2,
  V3: pachraPromptV3,
};
