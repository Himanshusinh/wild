import { todaembroideryPromptV1 } from "./todaembroideryPromptV1";
import { todaembroideryPromptV2 } from "./todaembroideryPromptV2";
import { todaembroideryPromptV3 } from "./todaembroideryPromptV3";

export type TodaembroideryVersion = "V1" | "V2" | "V3";

export const TODAEMBROIDERY_PROMPT_FAMILIES: Record<TodaembroideryVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: todaembroideryPromptV1,
  V2: todaembroideryPromptV2,
  V3: todaembroideryPromptV3,
};
