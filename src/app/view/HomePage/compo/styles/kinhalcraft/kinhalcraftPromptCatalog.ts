import { kinhalcraftPromptV1 } from "./kinhalcraftPromptV1";
import { kinhalcraftPromptV2 } from "./kinhalcraftPromptV2";
import { kinhalcraftPromptV3 } from "./kinhalcraftPromptV3";

export type KinhalCraftVersion = "V1" | "V2" | "V3";

export interface KinhalCraftPromptFamily {
  version: KinhalCraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KINHALCRAFT_PROMPT_FAMILIES: Record<KinhalCraftVersion, KinhalCraftPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KinhalCraft",
    ...kinhalcraftPromptV1,
  },
  V2: {
    version: "V2",
    chip: "WOODEN",
    title: "KinhalCraft Variations",
    ...kinhalcraftPromptV2,
  },
  V3: {
    version: "V3",
    chip: "PAINTED",
    title: "Dimensional KinhalCraft",
    ...kinhalcraftPromptV3,
  },
};
