import { khatwaPromptV1 } from "./khatwaPromptV1";
import { khatwaPromptV2 } from "./khatwaPromptV2";
import { khatwaPromptV3 } from "./khatwaPromptV3";

export type KhatwaVersion = "V1" | "V2" | "V3";

export interface KhatwaPromptFamily {
  version: KhatwaVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KHATWA_PROMPT_FAMILIES: Record<KhatwaVersion, KhatwaPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Khatwa Applique Cloth Logic",
    ...khatwaPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Khatwa Textile Translation",
    ...khatwaPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Khatwa Cinematic Textile World",
    ...khatwaPromptV3,
  },
};
