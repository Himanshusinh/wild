import { roganartPromptV1 } from "./roganartPromptV1";
import { roganartPromptV2 } from "./roganartPromptV2";
import { roganartPromptV3 } from "./roganartPromptV3";

export type RoganArtVersion = "V1" | "V2" | "V3";

export interface RoganArtPromptFamily {
  version: RoganArtVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const ROGANART_PROMPT_FAMILIES: Record<RoganArtVersion, RoganArtPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Rogan Oil-Paste Surface",
    ...roganartPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Rogan Art World",
    ...roganartPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Realistic Rogan Art World",
    ...roganartPromptV3,
  },
};
