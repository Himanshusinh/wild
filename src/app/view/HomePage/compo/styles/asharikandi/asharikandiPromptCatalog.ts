import { asharikandiPromptV1 } from "./asharikandiPromptV1";
import { asharikandiPromptV2 } from "./asharikandiPromptV2";
import { asharikandiPromptV3 } from "./asharikandiPromptV3";

export type AsharikandiVersion = "V1" | "V2" | "V3";

export interface AsharikandiPromptFamily {
  version: AsharikandiVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const ASHARIKANDI_PROMPT_FAMILIES: Record<AsharikandiVersion, AsharikandiPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Asharikandi Terracotta",
    ...asharikandiPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Artisan Clay Craft",
    ...asharikandiPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Dimensional Earthen World",
    ...asharikandiPromptV3,
  },
};
