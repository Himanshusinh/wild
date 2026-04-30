import { kalamkariPromptV1 } from "./kalamkariPromptV1";
import { kalamkariPromptV2 } from "./kalamkariPromptV2";
import { kalamkariPromptV3 } from "./kalamkariPromptV3";

export type KalamkariVersion = "V1" | "V2" | "V3";

export interface KalamkariPromptFamily {
  version: KalamkariVersion;
  /** Universal hard prompt (text-to-image). */
  promptHard: string;
  /** Slot-based template. */
  promptVariable: string;
  /** Image-to-image instruction. */
  promptI2I: string;
  chip: string;
  title: string;
}

export const KALAMKARI_PROMPT_FAMILIES: Record<KalamkariVersion, KalamkariPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Machilipatnam Kalamkari",
    ...kalamkariPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Translation",
    ...kalamkariPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Volumetric World",
    ...kalamkariPromptV3,
  },
};

