import { monpaPromptV1 } from "./monpaPromptV1";
import { monpaPromptV2 } from "./monpaPromptV2";
import { monpaPromptV3 } from "./monpaPromptV3";

export type MonpaVersion = "V1" | "V2" | "V3";

export interface MonpaPromptFamily {
  version: MonpaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const MONPA_PROMPT_FAMILIES: Record<MonpaVersion, MonpaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Monpa Textile",
    ...monpaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "2D/3D Woven World",
    ...monpaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Woven World",
    ...monpaPromptV3,
  },
};

