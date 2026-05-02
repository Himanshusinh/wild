import { nirmalartPromptV1 } from "./nirmalartPromptV1";
import { nirmalartPromptV2 } from "./nirmalartPromptV2";
import { nirmalartPromptV3 } from "./nirmalartPromptV3";

export type NirmalartVersion = "V1" | "V2" | "V3";

export const NIRMALART_PROMPT_FAMILIES: Record<NirmalartVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: nirmalartPromptV1,
  V2: nirmalartPromptV2,
  V3: nirmalartPromptV3,
};
