import { ganjifaPromptV1 } from "./ganjifaPromptV1";
import { ganjifaPromptV2 } from "./ganjifaPromptV2";
import { ganjifaPromptV3 } from "./ganjifaPromptV3";

export type GanjifaVersion = "V1" | "V2" | "V3";

export interface GanjifaPromptFamily {
  version: GanjifaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const GANJIFA_PROMPT_FAMILIES: Record<GanjifaVersion, GanjifaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Ganjifa",
    ...ganjifaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "CIRCULAR",
    title: "Ganjifa Variations",
    ...ganjifaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "HAND-PAINTED",
    title: "Dimensional Ganjifa",
    ...ganjifaPromptV3,
  },
};
