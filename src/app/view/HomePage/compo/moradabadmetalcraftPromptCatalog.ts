import { moradabadmetalcraftPromptV1 } from "./moradabadmetalcraftPromptV1";
import { moradabadmetalcraftPromptV2 } from "./moradabadmetalcraftPromptV2";
import { moradabadmetalcraftPromptV3 } from "./moradabadmetalcraftPromptV3";

export type MoradabadmetalcraftVersion = "V1" | "V2" | "V3";

export interface MoradabadmetalcraftPromptFamily {
  version: MoradabadmetalcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MORADABADMETALCRAFT_PROMPT_FAMILIES: Record<MoradabadmetalcraftVersion, MoradabadmetalcraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "MORADABAD METAL CRAFT", ...moradabadmetalcraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "MORADABAD METAL CRAFT", ...moradabadmetalcraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "MORADABAD METAL CRAFT", ...moradabadmetalcraftPromptV3 },
};
