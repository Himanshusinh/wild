import { gharcholaPromptV1 } from "./gharcholaPromptV1";
import { gharcholaPromptV2 } from "./gharcholaPromptV2";
import { gharcholaPromptV3 } from "./gharcholaPromptV3";

export type GharcholaVersion = "V1" | "V2" | "V3";

export interface GharcholaPromptFamily {
  version: GharcholaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const GHARCHOLA_PROMPT_FAMILIES: Record<GharcholaVersion, GharcholaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Gharchola",
    ...gharcholaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "BRIDAL",
    title: "Gharchola Variations",
    ...gharcholaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "GRID",
    title: "Dimensional Gharchola",
    ...gharcholaPromptV3,
  },
};
