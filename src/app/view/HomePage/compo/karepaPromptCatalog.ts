import { karepaPromptV1 } from "./karepaPromptV1";
import { karepaPromptV2 } from "./karepaPromptV2";
import { karepaPromptV3 } from "./karepaPromptV3";

export type KarepaVersion = "V1" | "V2" | "V3";

export interface KarepaPromptFamily {
  version: KarepaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KAREPA_PROMPT_FAMILIES: Record<KarepaVersion, KarepaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Karepa Shell Window Logic",
    ...karepaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Karepa Translation",
    ...karepaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Karepa Cinematic World",
    ...karepaPromptV3,
  },
};
