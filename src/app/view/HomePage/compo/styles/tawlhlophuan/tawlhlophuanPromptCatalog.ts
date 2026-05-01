import { tawlhlophuanPromptV1 } from "./tawlhlophuanPromptV1";
import { tawlhlophuanPromptV2 } from "./tawlhlophuanPromptV2";
import { tawlhlophuanPromptV3 } from "./tawlhlophuanPromptV3";

export type TawlhlophuanVersion = "V1" | "V2" | "V3";

export interface TawlhlophuanPromptFamily {
  version: TawlhlophuanVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TAWLHLOPHUAN_PROMPT_FAMILIES: Record<TawlhlophuanVersion, TawlhlophuanPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Tawlhlophuan",
    ...tawlhlophuanPromptV1,
  },
  V2: {
    version: "V2",
    chip: "WARRIOR",
    title: "Tawlhlophuan Variations",
    ...tawlhlophuanPromptV2,
  },
  V3: {
    version: "V3",
    chip: "WOVEN",
    title: "Dimensional Tawlhlophuan",
    ...tawlhlophuanPromptV3,
  },
};
