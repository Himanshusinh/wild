import { malerkotlazariPromptV1 } from "./malerkotlazariPromptV1";
import { malerkotlazariPromptV2 } from "./malerkotlazariPromptV2";
import { malerkotlazariPromptV3 } from "./malerkotlazariPromptV3";

export type MalerkotlaZariVersion = "V1" | "V2" | "V3";

export interface MalerkotlaZariPromptFamily {
  version: MalerkotlaZariVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MALERKOTLAZARI_PROMPT_FAMILIES: Record<MalerkotlaZariVersion, MalerkotlaZariPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Malerkotla Zari",
    ...malerkotlazariPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Malerkotla Zari",
    ...malerkotlazariPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Malerkotla Zari",
    ...malerkotlazariPromptV3,
  },
};
