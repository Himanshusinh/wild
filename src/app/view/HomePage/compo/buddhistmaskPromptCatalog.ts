import { buddhistmaskPromptV1 } from "./buddhistmaskPromptV1";
import { buddhistmaskPromptV2 } from "./buddhistmaskPromptV2";
import { buddhistmaskPromptV3 } from "./buddhistmaskPromptV3";

export type BuddhistMaskVersion = "V1" | "V2" | "V3";

export interface BuddhistMaskPromptFamily {
  version: BuddhistMaskVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BUDDHISTMASK_PROMPT_FAMILIES: Record<BuddhistMaskVersion, BuddhistMaskPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Buddhist Mask",
    ...buddhistmaskPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Buddhist Mask",
    ...buddhistmaskPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Buddhist Mask",
    ...buddhistmaskPromptV3,
  },
};
