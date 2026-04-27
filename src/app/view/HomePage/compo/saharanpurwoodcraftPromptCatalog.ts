import { saharanpurwoodcraftPromptV1 } from "./saharanpurwoodcraftPromptV1";
import { saharanpurwoodcraftPromptV2 } from "./saharanpurwoodcraftPromptV2";
import { saharanpurwoodcraftPromptV3 } from "./saharanpurwoodcraftPromptV3";

export type SaharanpurwoodcraftVersion = "V1" | "V2" | "V3";

export interface SaharanpurwoodcraftPromptFamily {
  version: SaharanpurwoodcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SAHARANPURWOODCRAFT_PROMPT_FAMILIES: Record<SaharanpurwoodcraftVersion, SaharanpurwoodcraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "SAHARANPUR WOOD CRAFT", ...saharanpurwoodcraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "SAHARANPUR WOOD CRAFT", ...saharanpurwoodcraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "SAHARANPUR WOOD CRAFT", ...saharanpurwoodcraftPromptV3 },
};
