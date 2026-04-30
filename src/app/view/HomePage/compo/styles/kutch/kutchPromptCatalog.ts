import { kutchPromptV1 } from "./kutchPromptV1";
import { kutchPromptV2 } from "./kutchPromptV2";
import { kutchPromptV3 } from "./kutchPromptV3";

export type KutchVersion = "V1" | "V2" | "V3";

export interface KutchPromptFamily {
  version: KutchVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const KUTCH_PROMPT_FAMILIES: Record<KutchVersion, KutchPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Kutch Branch-Locked Embroidery",
    ...kutchPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Kutch Embroidery Translation",
    ...kutchPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Kutch Embroidery World",
    ...kutchPromptV3,
  },
};
