import { sherdukpenPromptV1 } from "./sherdukpenPromptV1";
import { sherdukpenPromptV2 } from "./sherdukpenPromptV2";
import { sherdukpenPromptV3 } from "./sherdukpenPromptV3";

export type SherdukpenVersion = "V1" | "V2" | "V3";

export interface SherdukpenPromptFamily {
  version: SherdukpenVersion;
  promptHard: string;
  promptVariable: string;
  promptI2I: string;
  chip: string;
  title: string;
}

export const SHERDUKPEN_PROMPT_FAMILIES: Record<
  SherdukpenVersion,
  SherdukpenPromptFamily
> = {
  V1: {
    version: "V1",
    chip: "AUTHENTIC",
    title: "Sherdukpen Utility Weave",
    ...sherdukpenPromptV1,
  },
  V2: {
    version: "V2",
    chip: "ARTISAN",
    title: "Handcrafted Dimensional Weave",
    ...sherdukpenPromptV2,
  },
  V3: {
    version: "V3",
    chip: "CINEMATIC",
    title: "Full 3D Cinematic Woven World",
    ...sherdukpenPromptV3,
  },
};

