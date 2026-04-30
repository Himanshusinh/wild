import { jhajjarPromptV1 } from "./jhajjarPromptV1";
import { jhajjarPromptV2 } from "./jhajjarPromptV2";
import { jhajjarPromptV3 } from "./jhajjarPromptV3";

export type JhajjarVersion = "V1" | "V2" | "V3";

export interface JhajjarPromptFamily {
  version: JhajjarVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const JHAJJAR_PROMPT_FAMILIES: Record<JhajjarVersion, JhajjarPromptFamily> =
  {
    V1: {
      version: "V1",
      chip: "AUTHENTIC",
      title: "Jhajjar Terracotta Vessels",
      ...jhajjarPromptV1,
    },
    V2: {
      version: "V2",
      chip: "ARTISAN",
      title: "Dimensional Jhajjar Vessel World",
      ...jhajjarPromptV2,
    },
    V3: {
      version: "V3",
      chip: "CINEMATIC",
      title: "3D Realistic Jhajjar Pottery World",
      ...jhajjarPromptV3,
    },
  };
