import { cholaoldbronzePromptV1 } from "./cholaoldbronzePromptV1";
import { cholaoldbronzePromptV2 } from "./cholaoldbronzePromptV2";
import { cholaoldbronzePromptV3 } from "./cholaoldbronzePromptV3";

export type CholaoldbronzeVersion = "V1" | "V2" | "V3";

export const CHOLAOLDBRONZE_PROMPT_FAMILIES: Record<CholaoldbronzeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: cholaoldbronzePromptV1,
  V2: cholaoldbronzePromptV2,
  V3: cholaoldbronzePromptV3,
};
