import { bhotiaweavingPromptV1 } from "./bhotiaweavingPromptV1";
import { bhotiaweavingPromptV2 } from "./bhotiaweavingPromptV2";
import { bhotiaweavingPromptV3 } from "./bhotiaweavingPromptV3";

export type BhotiaweavingVersion = "V1" | "V2" | "V3";

export const BHOTIAWEAVING_PROMPT_FAMILIES: Record<BhotiaweavingVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: bhotiaweavingPromptV1,
  V2: bhotiaweavingPromptV2,
  V3: bhotiaweavingPromptV3,
};
