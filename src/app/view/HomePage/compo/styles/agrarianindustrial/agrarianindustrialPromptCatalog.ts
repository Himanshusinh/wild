import { agrarianindustrialPromptV1 } from "./agrarianindustrialPromptV1";
import { agrarianindustrialPromptV2 } from "./agrarianindustrialPromptV2";
import { agrarianindustrialPromptV3 } from "./agrarianindustrialPromptV3";

export type AgrarianIndustrialVersion = "V1" | "V2" | "V3";

export interface AgrarianIndustrialPromptFamily {
  version: AgrarianIndustrialVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const AGRARIANINDUSTRIAL_PROMPT_FAMILIES: Record<AgrarianIndustrialVersion, AgrarianIndustrialPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "AgrarianIndustrial",
    ...agrarianindustrialPromptV1,
  },
  V2: {
    version: "V2",
    chip: "PRODUCTION",
    title: "AgrarianIndustrial Variations",
    ...agrarianindustrialPromptV2,
  },
  V3: {
    version: "V3",
    chip: "MACHINERY",
    title: "Dimensional AgrarianIndustrial",
    ...agrarianindustrialPromptV3,
  },
};
