import { phulkariPromptV3 } from "./phulkariPromptV3";
export type PhulkariVersion = "V3";
export interface PhulkariPromptFamily {
  version: PhulkariVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const PHULKARI_PROMPT_FAMILIES: Record<PhulkariVersion, PhulkariPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic PHULKARI World",
      ...phulkariPromptV3,
    },
};