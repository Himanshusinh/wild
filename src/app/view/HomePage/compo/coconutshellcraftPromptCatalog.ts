import { coconutshellcraftPromptV1 } from "./coconutshellcraftPromptV1";
import { coconutshellcraftPromptV2 } from "./coconutshellcraftPromptV2";
import { coconutshellcraftPromptV3 } from "./coconutshellcraftPromptV3";

export type CoconutshellcraftVersion = "V1" | "V2" | "V3";

export interface CoconutshellcraftPromptFamily {
  version: CoconutshellcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const COCONUTSHELLCRAFT_PROMPT_FAMILIES: Record<CoconutshellcraftVersion, CoconutshellcraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "COCONUT SHELL CRAFT", ...coconutshellcraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "COCONUT SHELL CRAFT", ...coconutshellcraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "COCONUT SHELL CRAFT", ...coconutshellcraftPromptV3 },
};
