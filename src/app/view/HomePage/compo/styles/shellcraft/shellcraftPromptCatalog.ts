import { shellcraftPromptV1 } from "./shellcraftPromptV1";
import { shellcraftPromptV2 } from "./shellcraftPromptV2";
import { shellcraftPromptV3 } from "./shellcraftPromptV3";

export type ShellcraftVersion = "V1" | "V2" | "V3";

export interface ShellcraftPromptFamily {
  version: ShellcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SHELLCRAFT_PROMPT_FAMILIES: Record<ShellcraftVersion, ShellcraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "SHELL CRAFT", ...shellcraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "SHELL CRAFT", ...shellcraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "SHELL CRAFT", ...shellcraftPromptV3 },
};
