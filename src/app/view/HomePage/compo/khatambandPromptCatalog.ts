import { khatambandPromptV1 } from "./khatambandPromptV1";
import { khatambandPromptV2 } from "./khatambandPromptV2";
import { khatambandPromptV3 } from "./khatambandPromptV3";

export type KhatambandVersion = "V1" | "V2" | "V3";

export interface KhatambandPromptFamily {
  version: KhatambandVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHATAMBAND_PROMPT_FAMILIES: Record<KhatambandVersion, KhatambandPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Khatamband Woodwork",
    ...khatambandPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Wood Translation",
    ...khatambandPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Wood World",
    ...khatambandPromptV3,
  },
};
