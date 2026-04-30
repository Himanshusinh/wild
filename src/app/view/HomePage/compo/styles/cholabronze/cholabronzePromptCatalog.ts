import { cholabronzePromptV1 } from "./cholabronzePromptV1";
import { cholabronzePromptV2 } from "./cholabronzePromptV2";
import { cholabronzePromptV3 } from "./cholabronzePromptV3";

export type CholabronzeVersion = "V1" | "V2" | "V3";

export const CHOLABRONZE_PROMPT_FAMILIES: Record<CholabronzeVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: cholabronzePromptV1,
  V2: cholabronzePromptV2,
  V3: cholabronzePromptV3,
};
