import { bundelipaintingPromptV1 } from "./bundelipaintingPromptV1";
import { bundelipaintingPromptV2 } from "./bundelipaintingPromptV2";
import { bundelipaintingPromptV3 } from "./bundelipaintingPromptV3";

export type BundeliPaintingVersion = "V1" | "V2" | "V3";

export interface BundeliPaintingPromptFamily {
  version: BundeliPaintingVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const BUNDELIPAINTING_PROMPT_FAMILIES: Record<BundeliPaintingVersion, BundeliPaintingPromptFamily> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "BundeliPainting",
    ...bundelipaintingPromptV1,
  },
  V2: {
    version: "V2",
    chip: "MURAL",
    title: "BundeliPainting Variations",
    ...bundelipaintingPromptV2,
  },
  V3: {
    version: "V3",
    chip: "NARRATIVE",
    title: "Dimensional BundeliPainting",
    ...bundelipaintingPromptV3,
  },
};
