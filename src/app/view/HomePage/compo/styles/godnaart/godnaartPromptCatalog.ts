import { godnaartPromptV1 } from "./godnaartPromptV1";
import { godnaartPromptV2 } from "./godnaartPromptV2";
import { godnaartPromptV3 } from "./godnaartPromptV3";

export type GodnaArtVersion = "V1" | "V2" | "V3";

export interface GodnaArtPromptFamily {
  version: GodnaArtVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const GODNAART_PROMPT_FAMILIES: Record<GodnaArtVersion, GodnaArtPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "GodnaArt",
    ...godnaartPromptV1,
  },
  V2: {
    version: "V2",
    chip: "TATTOO",
    title: "GodnaArt Variations",
    ...godnaartPromptV2,
  },
  V3: {
    version: "V3",
    chip: "NARRATIVE",
    title: "Dimensional GodnaArt",
    ...godnaartPromptV3,
  },
};
