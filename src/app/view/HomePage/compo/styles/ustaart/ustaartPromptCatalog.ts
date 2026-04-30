import { ustaartPromptV1 } from "./ustaartPromptV1";
import { ustaartPromptV2 } from "./ustaartPromptV2";
import { ustaartPromptV3 } from "./ustaartPromptV3";

export type UstaArtVersion = "V1" | "V2" | "V3";

export interface UstaArtPromptFamily {
  version: UstaArtVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const USTAART_PROMPT_FAMILIES: Record<UstaArtVersion, UstaArtPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Authentic Usta Art",
    ...ustaartPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Dimensional Usta Art",
    ...ustaartPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "3D Cinematic Usta Art",
    ...ustaartPromptV3,
  },
};
