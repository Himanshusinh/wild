import { sauraPromptV1 } from "./sauraPromptV1";
import { sauraPromptV2 } from "./sauraPromptV2";
import { sauraPromptV3 } from "./sauraPromptV3";

export type SauraVersion = "V1" | "V2" | "V3";

export interface SauraPromptFamily {
  version: SauraVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SAURA_PROMPT_FAMILIES: Record<SauraVersion, SauraPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Saura",
    ...sauraPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Saura",
    ...sauraPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Saura",
    ...sauraPromptV3,
  },
};
