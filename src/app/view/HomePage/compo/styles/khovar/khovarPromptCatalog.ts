import { khovarPromptV1 } from "./khovarPromptV1";
import { khovarPromptV2 } from "./khovarPromptV2";
import { khovarPromptV3 } from "./khovarPromptV3";

export type KhovarVersion = "V1" | "V2" | "V3";

export interface KhovarPromptFamily {
  version: KhovarVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHOVAR_PROMPT_FAMILIES: Record<KhovarVersion, KhovarPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Khovar Marriage Wall Logic",
    ...khovarPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Khovar Wall Translation",
    ...khovarPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Khovar Wall World",
    ...khovarPromptV3,
  },
};
