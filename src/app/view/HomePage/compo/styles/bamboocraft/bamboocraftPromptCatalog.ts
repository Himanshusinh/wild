import { bamboocraftPromptV1 } from "./bamboocraftPromptV1";
import { bamboocraftPromptV2 } from "./bamboocraftPromptV2";
import { bamboocraftPromptV3 } from "./bamboocraftPromptV3";

export type BambooCraftVersion = "V1" | "V2" | "V3";

export interface BambooCraftPromptFamily {
  version: BambooCraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BAMBOOCRAFT_PROMPT_FAMILIES: Record<BambooCraftVersion, BambooCraftPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BambooCraft",
    ...bamboocraftPromptV1,
  },
  V2: {
    version: "V2",
    chip: "WOVEN",
    title: "BambooCraft Variations",
    ...bamboocraftPromptV2,
  },
  V3: {
    version: "V3",
    chip: "FUNCTIONAL",
    title: "Dimensional BambooCraft",
    ...bamboocraftPromptV3,
  },
};
