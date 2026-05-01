import { phulkariPromptV1 } from "./phulkariPromptV1";
import { phulkariPromptV2 } from "./phulkariPromptV2";
import { phulkariPromptV3 } from "./phulkariPromptV3";

export type PhulkariVersion = "V1" | "V2" | "V3";

export interface PhulkariPromptFamily {
  version: PhulkariVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PHULKARI_PROMPT_FAMILIES: Record<PhulkariVersion, PhulkariPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Phulkari Embroidered Surface",
    ...phulkariPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Phulkari World",
    ...phulkariPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Phulkari World",
    ...phulkariPromptV3,
  },
};
