import { tamilritualcraftPromptV1 } from "./tamilritualcraftPromptV1";
import { tamilritualcraftPromptV2 } from "./tamilritualcraftPromptV2";
import { tamilritualcraftPromptV3 } from "./tamilritualcraftPromptV3";

export type TamilritualcraftVersion = "V1" | "V2" | "V3";

export const TAMILRITUALCRAFT_PROMPT_FAMILIES: Record<TamilritualcraftVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: tamilritualcraftPromptV1,
  V2: tamilritualcraftPromptV2,
  V3: tamilritualcraftPromptV3,
};
