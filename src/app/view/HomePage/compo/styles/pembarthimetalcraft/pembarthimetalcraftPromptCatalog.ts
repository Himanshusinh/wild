import { pembarthimetalcraftPromptV1 } from "./pembarthimetalcraftPromptV1";
import { pembarthimetalcraftPromptV2 } from "./pembarthimetalcraftPromptV2";
import { pembarthimetalcraftPromptV3 } from "./pembarthimetalcraftPromptV3";

export type PembarthimetalcraftVersion = "V1" | "V2" | "V3";

export const PEMBARTHIMETALCRAFT_PROMPT_FAMILIES: Record<PembarthimetalcraftVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: pembarthimetalcraftPromptV1,
  V2: pembarthimetalcraftPromptV2,
  V3: pembarthimetalcraftPromptV3,
};
