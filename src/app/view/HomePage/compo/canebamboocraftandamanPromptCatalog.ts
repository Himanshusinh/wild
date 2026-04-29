import { canebamboocraftandamanPromptV1 } from "./canebamboocraftandamanPromptV1";
import { canebamboocraftandamanPromptV2 } from "./canebamboocraftandamanPromptV2";
import { canebamboocraftandamanPromptV3 } from "./canebamboocraftandamanPromptV3";

export type CanebamboocraftandamanVersion = "V1" | "V2" | "V3";

export interface CanebamboocraftandamanPromptFamily {
  version: CanebamboocraftandamanVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const CANEBAMBOOCRAFTANDAMAN_PROMPT_FAMILIES: Record<CanebamboocraftandamanVersion, CanebamboocraftandamanPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "CANE & BAMBOO CRAFT", ...canebamboocraftandamanPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "CANE & BAMBOO CRAFT", ...canebamboocraftandamanPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "CANE & BAMBOO CRAFT", ...canebamboocraftandamanPromptV3 },
};
