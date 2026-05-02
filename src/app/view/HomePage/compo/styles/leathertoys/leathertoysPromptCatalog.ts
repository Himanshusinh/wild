import { leathertoysPromptV1 } from "./leathertoysPromptV1";
import { leathertoysPromptV2 } from "./leathertoysPromptV2";
import { leathertoysPromptV3 } from "./leathertoysPromptV3";

export type LeatherToysVersion = "V1" | "V2" | "V3";

export interface LeatherToysPromptFamily {
  version: LeatherToysVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const LEATHERTOYS_PROMPT_FAMILIES: Record<LeatherToysVersion, LeatherToysPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "LeatherToys",
    ...leathertoysPromptV1,
  },
  V2: {
    version: "V2",
    chip: "LEATHER",
    title: "LeatherToys Variations",
    ...leathertoysPromptV2,
  },
  V3: {
    version: "V3",
    chip: "PAINTED",
    title: "Dimensional LeatherToys",
    ...leathertoysPromptV3,
  },
};
