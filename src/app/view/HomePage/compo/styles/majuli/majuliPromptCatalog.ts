import { majuliPromptV1 } from "./majuliPromptV1";
import { majuliPromptV2 } from "./majuliPromptV2";
import { majuliPromptV3 } from "./majuliPromptV3";

export type MajuliVersion = "V1" | "V2" | "V3";

export interface MajuliPromptFamily {
  version: MajuliVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MAJULI_PROMPT_FAMILIES: Record<MajuliVersion, MajuliPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Majuli Bhaona Mask Grammar",
    ...majuliPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Majuli Mask Translation",
    ...majuliPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Majuli Mask World",
    ...majuliPromptV3,
  },
};
