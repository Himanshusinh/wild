import { woodcraftPromptV1 } from "./woodcraftPromptV1";
import { woodcraftPromptV2 } from "./woodcraftPromptV2";
import { woodcraftPromptV3 } from "./woodcraftPromptV3";

export type WoodcraftVersion = "V1" | "V2" | "V3";

export interface WoodcraftPromptFamily {
  version: WoodcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const WOODCRAFT_PROMPT_FAMILIES: Record<WoodcraftVersion, WoodcraftPromptFamily> = {
  V1: { version: "V1", chip: "AUTHENTIC", title: "WOODCRAFT", ...woodcraftPromptV1 },
  V2: { version: "V2", chip: "ARTISAN", title: "WOODCRAFT", ...woodcraftPromptV2 },
  V3: { version: "V3", chip: "CINEMATIC", title: "WOODCRAFT", ...woodcraftPromptV3 },
};
