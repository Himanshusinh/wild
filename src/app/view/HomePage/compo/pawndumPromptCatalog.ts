import { pawndumPromptV1 } from "./pawndumPromptV1";
import { pawndumPromptV2 } from "./pawndumPromptV2";
import { pawndumPromptV3 } from "./pawndumPromptV3";

export type PawndumVersion = "V1" | "V2" | "V3";

export interface PawndumPromptFamily {
  version: PawndumVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const PAWNDUM_PROMPT_FAMILIES: Record<PawndumVersion, PawndumPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Pawndum",
    ...pawndumPromptV1,
  },
  V2: {
    version: "V2",
    chip: "STRIPES",
    title: "Pawndum Variations",
    ...pawndumPromptV2,
  },
  V3: {
    version: "V3",
    chip: "PANEL-CONSTRUCTION",
    title: "Dimensional Pawndum",
    ...pawndumPromptV3,
  },
};
