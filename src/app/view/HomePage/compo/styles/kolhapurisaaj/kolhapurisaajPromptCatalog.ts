import { kolhapurisaajPromptV1 } from "./kolhapurisaajPromptV1";
import { kolhapurisaajPromptV2 } from "./kolhapurisaajPromptV2";
import { kolhapurisaajPromptV3 } from "./kolhapurisaajPromptV3";

export type KolhapuriSaajVersion = "V1" | "V2" | "V3";

export interface KolhapuriSaajPromptFamily {
  version: KolhapuriSaajVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KOLHAPURISAAJ_PROMPT_FAMILIES: Record<KolhapuriSaajVersion, KolhapuriSaajPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KolhapuriSaaj",
    ...kolhapurisaajPromptV1,
  },
  V2: {
    version: "V2",
    chip: "NECKLACE",
    title: "KolhapuriSaaj Variations",
    ...kolhapurisaajPromptV2,
  },
  V3: {
    version: "V3",
    chip: "PENDANTS",
    title: "Dimensional KolhapuriSaaj",
    ...kolhapurisaajPromptV3,
  },
};
