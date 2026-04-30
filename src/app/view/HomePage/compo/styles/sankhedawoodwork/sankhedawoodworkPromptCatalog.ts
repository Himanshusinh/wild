import { sankhedawoodworkPromptV1 } from "./sankhedawoodworkPromptV1";
import { sankhedawoodworkPromptV2 } from "./sankhedawoodworkPromptV2";
import { sankhedawoodworkPromptV3 } from "./sankhedawoodworkPromptV3";

export type SankhedaWoodworkVersion = "V1" | "V2" | "V3";

export interface SankhedaWoodworkPromptFamily {
  version: SankhedaWoodworkVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SANKHEDAWOODWORK_PROMPT_FAMILIES: Record<SankhedaWoodworkVersion, SankhedaWoodworkPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "SankhedaWoodwork",
    ...sankhedawoodworkPromptV1,
  },
  V2: {
    version: "V2",
    chip: "TURNED-WOOD",
    title: "SankhedaWoodwork Variations",
    ...sankhedawoodworkPromptV2,
  },
  V3: {
    version: "V3",
    chip: "LACQUERED",
    title: "Dimensional SankhedaWoodwork",
    ...sankhedawoodworkPromptV3,
  },
};
