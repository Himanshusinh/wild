import { chambaminiaturePromptV1 } from "./chambaminiaturePromptV1";
import { chambaminiaturePromptV2 } from "./chambaminiaturePromptV2";
import { chambaminiaturePromptV3 } from "./chambaminiaturePromptV3";

export type ChambaMiniatureVersion = "V1" | "V2" | "V3";

export interface ChambaMiniaturePromptFamily {
  version: ChambaMiniatureVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const CHAMBAMINIATURE_PROMPT_FAMILIES: Record<ChambaMiniatureVersion, ChambaMiniaturePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "ChambaMiniature",
    ...chambaminiaturePromptV1,
  },
  V2: {
    version: "V2",
    chip: "COURT ART",
    title: "ChambaMiniature Variations",
    ...chambaminiaturePromptV2,
  },
  V3: {
    version: "V3",
    chip: "NARRATIVE",
    title: "Dimensional ChambaMiniature",
    ...chambaminiaturePromptV3,
  },
};
