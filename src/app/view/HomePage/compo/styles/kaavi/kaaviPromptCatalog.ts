import { kaaviPromptV1 } from "./kaaviPromptV1";
import { kaaviPromptV2 } from "./kaaviPromptV2";
import { kaaviPromptV3 } from "./kaaviPromptV3";

export type KaaviVersion = "V1" | "V2" | "V3";

export interface KaaviPromptFamily {
  version: KaaviVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KAAVI_PROMPT_FAMILIES: Record<KaaviVersion, KaaviPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kaavi Incised Wall Art",
    ...kaaviPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Kaavi Wall Translation",
    ...kaaviPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Kaavi Wall World",
    ...kaaviPromptV3,
  },
};
