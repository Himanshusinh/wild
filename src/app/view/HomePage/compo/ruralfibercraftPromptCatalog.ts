import { ruralfibercraftPromptV3 } from "./ruralfibercraftPromptV3";
export type RuralFiberCraftVersion = "V3";
export interface RuralFiberCraftPromptFamily {
  version: RuralFiberCraftVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}
export const RURALFIBERCRAFT_PROMPT_FAMILIES: Record<RuralFiberCraftVersion, RuralFiberCraftPromptFamily> = {
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic RURAL FIBER CRAFT World",
      ...ruralfibercraftPromptV3,
    },
};