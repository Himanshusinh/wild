import { handmadePaperPromptV1 } from "./handmadePaperPromptV1";
import { handmadePaperPromptV2 } from "./handmadePaperPromptV2";
import { handmadePaperPromptV3 } from "./handmadePaperPromptV3";

export type HandmadePaperVersion = "V1" | "V2" | "V3";

export interface HandmadePaperPromptFamily {
  version: HandmadePaperVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const HANDMADE_PAPER_PROMPT_FAMILIES: Record<
  HandmadePaperVersion,
  HandmadePaperPromptFamily
> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Handmade Paper",
    ...handmadePaperPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "2D/3D Paper World",
    ...handmadePaperPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Paper World",
    ...handmadePaperPromptV3,
  },
};

