import { khesPromptV1 } from "./khesPromptV1";
import { khesPromptV2 } from "./khesPromptV2";
import { khesPromptV3 } from "./khesPromptV3";

export type KhesVersion = "V1" | "V2" | "V3";

export interface KhesPromptFamily {
  version: KhesVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHES_PROMPT_FAMILIES: Record<KhesVersion, KhesPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Khes",
    ...khesPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Khes",
    ...khesPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Khes",
    ...khesPromptV3,
  },
};
