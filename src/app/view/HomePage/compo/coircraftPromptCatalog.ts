import { coircraftPromptV1 } from "./coircraftPromptV1";
import { coircraftPromptV2 } from "./coircraftPromptV2";
import { coircraftPromptV3 } from "./coircraftPromptV3";

export type CoirCraftVersion = "V1" | "V2" | "V3";

export interface CoirCraftPromptFamily {
  version: CoirCraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const COIRCRAFT_PROMPT_FAMILIES: Record<CoirCraftVersion, CoirCraftPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "CoirCraft",
    ...coircraftPromptV1,
  },
  V2: {
    version: "V2",
    chip: "FIBRE",
    title: "CoirCraft Variations",
    ...coircraftPromptV2,
  },
  V3: {
    version: "V3",
    chip: "TWISTED",
    title: "Dimensional CoirCraft",
    ...coircraftPromptV3,
  },
};
