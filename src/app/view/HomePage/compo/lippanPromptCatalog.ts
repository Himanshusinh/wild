import { lippanPromptV1 } from "./lippanPromptV1";
import { lippanPromptV2 } from "./lippanPromptV2";
import { lippanPromptV3 } from "./lippanPromptV3";

export type LippanVersion = "V1" | "V2" | "V3";

export interface LippanPromptFamily {
  version: LippanVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const LIPPAN_PROMPT_FAMILIES: Record<LippanVersion, LippanPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Lippan Mud and Mirror Logic",
    ...lippanPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Lippan Translation",
    ...lippanPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Lippan World",
    ...lippanPromptV3,
  },
};
