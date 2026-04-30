import { meritshawlPromptV1 } from "./meritshawlPromptV1";
import { meritshawlPromptV2 } from "./meritshawlPromptV2";
import { meritshawlPromptV3 } from "./meritshawlPromptV3";

export type MeritShawlVersion = "V1" | "V2" | "V3";

export interface MeritShawlPromptFamily {
  version: MeritShawlVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MERITSHAWL_PROMPT_FAMILIES: Record<MeritShawlVersion, MeritShawlPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "MeritShawl",
    ...meritshawlPromptV1,
  },
  V2: {
    version: "V2",
    chip: "CEREMONIAL",
    title: "MeritShawl Variations",
    ...meritshawlPromptV2,
  },
  V3: {
    version: "V3",
    chip: "SEGMENTED",
    title: "Dimensional MeritShawl",
    ...meritshawlPromptV3,
  },
};
