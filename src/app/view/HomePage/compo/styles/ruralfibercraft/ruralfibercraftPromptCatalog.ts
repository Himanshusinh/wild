import { ruralfibercraftPromptV1 } from "./ruralfibercraftPromptV1";
import { ruralfibercraftPromptV2 } from "./ruralfibercraftPromptV2";
import { ruralfibercraftPromptV3 } from "./ruralfibercraftPromptV3";

export type RuralFiberCraftVersion = "V1" | "V2" | "V3";

export interface RuralFiberCraftPromptFamily {
  version: RuralFiberCraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const RURALFIBERCRAFT_PROMPT_FAMILIES: Record<RuralFiberCraftVersion, RuralFiberCraftPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Rural Fiber Woven Surface",
    ...ruralfibercraftPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Rural Fiber World",
    ...ruralfibercraftPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Rural Fiber World",
    ...ruralfibercraftPromptV3,
  },
};
