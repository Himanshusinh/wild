import { kosaPromptV1 } from "./kosaPromptV1";
import { kosaPromptV2 } from "./kosaPromptV2";
import { kosaPromptV3 } from "./kosaPromptV3";

export type KosaVersion = "V1" | "V2" | "V3";

export interface KosaPromptFamily {
  version: KosaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KOSA_PROMPT_FAMILIES: Record<KosaVersion, KosaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kosa Silk Handloom Logic",
    ...kosaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Kosa Textile Translation",
    ...kosaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Kosa Textile World",
    ...kosaPromptV3,
  },
};
