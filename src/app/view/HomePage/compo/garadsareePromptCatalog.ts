import { garadsareePromptV1 } from "./garadsareePromptV1";
import { garadsareePromptV2 } from "./garadsareePromptV2";
import { garadsareePromptV3 } from "./garadsareePromptV3";

export type GaradsareeVersion = "V1" | "V2" | "V3";

export interface GaradsareePromptFamily {
  version: GaradsareeVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const GARADSAREE_PROMPT_FAMILIES: Record<GaradsareeVersion, GaradsareePromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Garad Silk Weaving",
    ...garadsareePromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Ethereal Silk Translation",
    ...garadsareePromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Garad World",
    ...garadsareePromptV3,
  },
};
