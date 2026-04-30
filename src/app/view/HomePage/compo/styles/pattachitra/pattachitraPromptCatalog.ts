import { pattachitraPromptV1 } from "./pattachitraPromptV1";
import { pattachitraPromptV2 } from "./pattachitraPromptV2";
import { pattachitraPromptV3 } from "./pattachitraPromptV3";

export type PattachitraVersion = "V1" | "V2" | "V3";

export interface PattachitraPromptFamily {
  version: PattachitraVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PATTACHITRA_PROMPT_FAMILIES: Record<PattachitraVersion, PattachitraPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Pattachitra",
    ...pattachitraPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Pattachitra",
    ...pattachitraPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Pattachitra",
    ...pattachitraPromptV3,
  },
};
