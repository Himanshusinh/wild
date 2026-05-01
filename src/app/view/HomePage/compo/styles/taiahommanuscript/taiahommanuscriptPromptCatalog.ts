import { taiahommanuscriptPromptV1 } from "./taiahommanuscriptPromptV1";
import { taiahommanuscriptPromptV2 } from "./taiahommanuscriptPromptV2";
import { taiahommanuscriptPromptV3 } from "./taiahommanuscriptPromptV3";

export type TaiAhomManuscriptVersion = "V1" | "V2" | "V3";

export interface TaiAhomManuscriptPromptFamily {
  version: TaiAhomManuscriptVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TAIAHOMMANUSCRIPT_PROMPT_FAMILIES: Record<TaiAhomManuscriptVersion, TaiAhomManuscriptPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "TaiAhomManuscript",
    ...taiahommanuscriptPromptV1,
  },
  V2: {
    version: "V2",
    chip: "SCRIPT",
    title: "TaiAhomManuscript Variations",
    ...taiahommanuscriptPromptV2,
  },
  V3: {
    version: "V3",
    chip: "FOLIO",
    title: "Dimensional TaiAhomManuscript",
    ...taiahommanuscriptPromptV3,
  },
};
