import { sanganerPromptV1 } from "./sanganerPromptV1";
import { sanganerPromptV2 } from "./sanganerPromptV2";
import { sanganerPromptV3 } from "./sanganerPromptV3";

export type SanganerVersion = "V1" | "V2" | "V3";

export interface SanganerPromptFamily {
  version: SanganerVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SANGANER_PROMPT_FAMILIES: Record<SanganerVersion, SanganerPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Sanganer",
    ...sanganerPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Sanganer",
    ...sanganerPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Sanganer",
    ...sanganerPromptV3,
  },
};
