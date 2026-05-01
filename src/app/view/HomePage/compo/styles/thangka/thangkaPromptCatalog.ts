import { thangkaPromptV1 } from "./thangkaPromptV1";
import { thangkaPromptV2 } from "./thangkaPromptV2";
import { thangkaPromptV3 } from "./thangkaPromptV3";

export type ThangkaVersion = "V1" | "V2" | "V3";

export interface ThangkaPromptFamily {
  version: ThangkaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const THANGKA_PROMPT_FAMILIES: Record<ThangkaVersion, ThangkaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Thangka",
    ...thangkaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Thangka",
    ...thangkaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Thangka",
    ...thangkaPromptV3,
  },
};
