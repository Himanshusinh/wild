import { bastardhokraPromptV1 } from "./bastardhokraPromptV1";
import { bastardhokraPromptV2 } from "./bastardhokraPromptV2";
import { bastardhokraPromptV3 } from "./bastardhokraPromptV3";

export type BastarDhokraVersion = "V1" | "V2" | "V3";

export interface BastarDhokraPromptFamily {
  version: BastarDhokraVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BASTARDHOKRA_PROMPT_FAMILIES: Record<BastarDhokraVersion, BastarDhokraPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BastarDhokra",
    ...bastardhokraPromptV1,
  },
  V2: {
    version: "V2",
    chip: "METALWORK",
    title: "BastarDhokra Variations",
    ...bastardhokraPromptV2,
  },
  V3: {
    version: "V3",
    chip: "LOST WAX",
    title: "Dimensional BastarDhokra",
    ...bastardhokraPromptV3,
  },
};
