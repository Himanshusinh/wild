import { togalugombeyaataPromptV1 } from "./togalugombeyaataPromptV1";
import { togalugombeyaataPromptV2 } from "./togalugombeyaataPromptV2";
import { togalugombeyaataPromptV3 } from "./togalugombeyaataPromptV3";

export type TogaluGombeyaataVersion = "V1" | "V2" | "V3";

export interface TogaluGombeyaataPromptFamily {
  version: TogaluGombeyaataVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TOGALUGOMBEYAATA_PROMPT_FAMILIES: Record<TogaluGombeyaataVersion, TogaluGombeyaataPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "TogaluGombeyaata",
    ...togalugombeyaataPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SHADOW-PUPPET",
    title: "TogaluGombeyaata Variations",
    ...togalugombeyaataPromptV2,
  },
  V3: {
    version: "V3",
    chip: "TRANSLUCENT",
    title: "Dimensional TogaluGombeyaata",
    ...togalugombeyaataPromptV3,
  },
};
