import { kolhapurichappalPromptV1 } from "./kolhapurichappalPromptV1";
import { kolhapurichappalPromptV2 } from "./kolhapurichappalPromptV2";
import { kolhapurichappalPromptV3 } from "./kolhapurichappalPromptV3";

export type KolhapuriChappalVersion = "V1" | "V2" | "V3";

export interface KolhapuriChappalPromptFamily {
  version: KolhapuriChappalVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KOLHAPURICHAPPAL_PROMPT_FAMILIES: Record<KolhapuriChappalVersion, KolhapuriChappalPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "KolhapuriChappal",
    ...kolhapurichappalPromptV1,
  },
  V2: {
    version: "V2",
    chip: "LEATHER",
    title: "KolhapuriChappal Variations",
    ...kolhapurichappalPromptV2,
  },
  V3: {
    version: "V3",
    chip: "FOOTWEAR",
    title: "Dimensional KolhapuriChappal",
    ...kolhapurichappalPromptV3,
  },
};
