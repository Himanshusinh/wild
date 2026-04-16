import { wanchoPromptV1 } from "./wanchoPromptV1";
import { wanchoPromptV2 } from "./wanchoPromptV2";
import { wanchoPromptV3 } from "./wanchoPromptV3";

export type WanchoVersion = "V1" | "V2" | "V3";

export interface WanchoPromptFamily {
  version: WanchoVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const WANCHO_PROMPT_FAMILIES: Record<WanchoVersion, WanchoPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Wancho Carving",
    ...wanchoPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Handcrafted Dimensional",
    ...wanchoPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Volumetric World",
    ...wanchoPromptV3,
  },
};

