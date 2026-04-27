import { tikuliartPromptV1 } from "./tikuliartPromptV1";
import { tikuliartPromptV2 } from "./tikuliartPromptV2";
import { tikuliartPromptV3 } from "./tikuliartPromptV3";

export type TikuliArtVersion = "V1" | "V2" | "V3";

export interface TikuliArtPromptFamily {
  version: TikuliArtVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const TIKULIART_PROMPT_FAMILIES: Record<TikuliArtVersion, TikuliArtPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "TikuliArt",
    ...tikuliartPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ENAMEL",
    title: "TikuliArt Variations",
    ...tikuliartPromptV2,
  },
  V3: {
    version: "V3",
    chip: "DECORATIVE",
    title: "Dimensional TikuliArt",
    ...tikuliartPromptV3,
  },
};
