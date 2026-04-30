import { keralamuralPromptV1 } from "./keralamuralPromptV1";
import { keralamuralPromptV2 } from "./keralamuralPromptV2";
import { keralamuralPromptV3 } from "./keralamuralPromptV3";

export type KeralaMuralVersion = "V1" | "V2" | "V3";

export interface KeralaMuralPromptFamily {
  version: KeralaMuralVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KERALAMURAL_PROMPT_FAMILIES: Record<KeralaMuralVersion, KeralaMuralPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KeralaMural",
    ...keralamuralPromptV1,
  },
  V2: {
    version: "V2",
    chip: "MURAL",
    title: "KeralaMural Variations",
    ...keralamuralPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CODIFIED",
    title: "Dimensional KeralaMural",
    ...keralamuralPromptV3,
  },
};
