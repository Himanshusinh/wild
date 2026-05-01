import { berhampurpattaPromptV1 } from "./berhampurpattaPromptV1";
import { berhampurpattaPromptV2 } from "./berhampurpattaPromptV2";
import { berhampurpattaPromptV3 } from "./berhampurpattaPromptV3";

export type BerhampurPattaVersion = "V1" | "V2" | "V3";

export interface BerhampurPattaPromptFamily {
  version: BerhampurPattaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BERHAMPURPATTA_PROMPT_FAMILIES: Record<BerhampurPattaVersion, BerhampurPattaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Berhampur Patta",
    ...berhampurpattaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Berhampur Patta",
    ...berhampurpattaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Berhampur Patta",
    ...berhampurpattaPromptV3,
  },
};
