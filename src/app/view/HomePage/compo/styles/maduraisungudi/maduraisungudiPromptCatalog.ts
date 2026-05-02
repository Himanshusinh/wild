import { maduraisungudiPromptV1 } from "./maduraisungudiPromptV1";
import { maduraisungudiPromptV2 } from "./maduraisungudiPromptV2";
import { maduraisungudiPromptV3 } from "./maduraisungudiPromptV3";

export type MaduraisungudiVersion = "V1" | "V2" | "V3";

export const MADURAISUNGUDI_PROMPT_FAMILIES: Record<MaduraisungudiVersion, {
  promptHard: string;
  promptVariable: string;
  promptI2I?: string;
}> = {
  V1: maduraisungudiPromptV1,
  V2: maduraisungudiPromptV2,
  V3: maduraisungudiPromptV3,
};
