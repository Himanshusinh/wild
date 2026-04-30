import { bastarwoodcraftPromptV1 } from "./bastarwoodcraftPromptV1";
import { bastarwoodcraftPromptV2 } from "./bastarwoodcraftPromptV2";
import { bastarwoodcraftPromptV3 } from "./bastarwoodcraftPromptV3";

export type BastarWoodcraftVersion = "V1" | "V2" | "V3";

export interface BastarWoodcraftPromptFamily {
  version: BastarWoodcraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BASTARWOODCRAFT_PROMPT_FAMILIES: Record<BastarWoodcraftVersion, BastarWoodcraftPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BastarWoodcraft",
    ...bastarwoodcraftPromptV1,
  },
  V2: {
    version: "V2",
    chip: "CARVED",
    title: "BastarWoodcraft Variations",
    ...bastarwoodcraftPromptV2,
  },
  V3: {
    version: "V3",
    chip: "SYMBOLIC",
    title: "Dimensional BastarWoodcraft",
    ...bastarwoodcraftPromptV3,
  },
};
