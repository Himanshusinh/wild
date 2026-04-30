import { sheerfieldclothPromptV1 } from "./sheerfieldclothPromptV1";
import { sheerfieldclothPromptV2 } from "./sheerfieldclothPromptV2";
import { sheerfieldclothPromptV3 } from "./sheerfieldclothPromptV3";

export type SheerFieldClothVersion = "V1" | "V2" | "V3";

export interface SheerFieldClothPromptFamily {
  version: SheerFieldClothVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SHEERFIELDCLOTH_PROMPT_FAMILIES: Record<SheerFieldClothVersion, SheerFieldClothPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "SheerFieldCloth",
    ...sheerfieldclothPromptV1,
  },
  V2: {
    version: "V2",
    chip: "TRANSLUCENT",
    title: "SheerFieldCloth Variations",
    ...sheerfieldclothPromptV2,
  },
  V3: {
    version: "V3",
    chip: "DRAPE",
    title: "Dimensional SheerFieldCloth",
    ...sheerfieldclothPromptV3,
  },
};
